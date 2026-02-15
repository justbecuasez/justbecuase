import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/database"
import { randomInt } from "crypto"

// Generate a cryptographically secure 6-digit OTP
function generateOTP(): string {
  return randomInt(100000, 999999).toString()
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "")
  
  // If doesn't start with +, assume Indian number and add +91
  if (!cleaned.startsWith("+")) {
    // Remove leading 0 if present
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1)
    }
    // If 10 digits, assume Indian number
    if (cleaned.length === 10) {
      cleaned = "+91" + cleaned
    }
  }
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone)
    
    // Basic validation
    if (formattedPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    const db = await getDb()
    const smsOtpCollection = db.collection("sms_otps")

    // Check rate limiting (max 5 OTPs per phone per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentOtps = await smsOtpCollection.countDocuments({
      phone: formattedPhone,
      createdAt: { $gte: oneHourAgo }
    })

    if (recentOtps >= 5) {
      return NextResponse.json({ 
        error: "Too many verification attempts. Please try again later." 
      }, { status: 429 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

    // Delete any existing OTPs for this phone
    await smsOtpCollection.deleteMany({ phone: formattedPhone })

    // Store new OTP
    await smsOtpCollection.insertOne({
      phone: formattedPhone,
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    })

    // Send SMS via configured provider
    // Check database config first, then environment variables
    const configCollection = db.collection("system_config")
    const smsConfig = await configCollection.findOne({ type: "sms" })
    const dbConfig = smsConfig?.data || {}
    
    console.log(`[SMS] DB Config found: ${smsConfig ? 'YES' : 'NO'}`)
    console.log(`[SMS] DB Config data: ${JSON.stringify({
      provider: dbConfig.provider,
      hasTwilioSid: !!dbConfig.twilioAccountSid,
      hasTwilioToken: !!dbConfig.twilioAuthToken,
      twilioPhone: dbConfig.twilioPhoneNumber
    })}`)
    
    const smsProvider = dbConfig.provider || process.env.SMS_PROVIDER || "none"
    
    console.log(`[SMS] Final Provider: ${smsProvider}, Phone: ${formattedPhone}`)
    
    if (smsProvider === "twilio") {
      const accountSid = dbConfig.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID
      const authToken = dbConfig.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
      const fromNumber = dbConfig.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER
      
      console.log(`[SMS] Twilio config - SID: ${accountSid ? accountSid.substring(0, 6) + '...' : 'MISSING'}, Token: ${authToken ? 'SET (' + authToken.length + ' chars)' : 'MISSING'}, From: ${fromNumber}`)
      
      if (accountSid && authToken && fromNumber) {
        // Send via Twilio
        const twilio = require("twilio")
        const client = twilio(accountSid, authToken)
        
        try {
          console.log(`[SMS] Attempting to send to ${formattedPhone} from ${fromNumber}`)
          const message = await client.messages.create({
            body: `Your JustBeCause Network verification code is: ${otp}. Valid for 10 minutes.`,
            from: fromNumber,
            to: formattedPhone
          })
          console.log(`[SMS] Message sent successfully. SID: ${message.sid}`)
        } catch (twilioError: any) {
          console.error("[SMS] Twilio SMS error:", {
            code: twilioError.code,
            message: twilioError.message,
            moreInfo: twilioError.moreInfo,
            status: twilioError.status
          })
          
          // Handle Twilio trial account restrictions (Error 21408)
          if (twilioError.code === 21408) {
            // Trial account - phone number not verified
            console.log(`[TWILIO TRIAL] OTP for ${formattedPhone}: ${otp}`)
            
            // In development, return helpful error and OTP
            if (process.env.NODE_ENV === "development") {
              return NextResponse.json({ 
                success: true, 
                message: "OTP generated (Twilio trial account - verify phone number in Twilio Console)",
                expiresAt: expiresAt.toISOString(),
                devOtp: otp,
                warning: "Trial account: Add your phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
              })
            }
            
            throw new Error("Phone number not verified in Twilio. Please verify your number in Twilio Console or contact support.")
          }
          
          // Handle invalid credentials (Error 20003)
          if (twilioError.code === 20003) {
            console.error(`[SMS] Invalid Twilio credentials - SID: ${accountSid?.substring(0, 6)}...`)
            throw new Error("SMS service configuration error. Please contact support.")
          }
          
          // Other Twilio errors
          throw twilioError
        }
      } else {
        console.warn("Twilio selected but not fully configured")
      }
    } else if (smsProvider === "vonage") {
      const apiKey = dbConfig.vonageApiKey || process.env.VONAGE_API_KEY
      const apiSecret = dbConfig.vonageApiSecret || process.env.VONAGE_API_SECRET
      const fromNumber = dbConfig.vonageFromNumber || process.env.VONAGE_FROM_NUMBER || "JustBecause"
      
      if (apiKey && apiSecret) {
        // Send via Vonage (Nexmo) SMS API
        // According to Vonage docs: POST with form-urlencoded body
        const vonageParams = new URLSearchParams({
          api_key: apiKey,
          api_secret: apiSecret,
          to: formattedPhone.replace("+", ""), // Remove + prefix as per Vonage docs
          from: fromNumber,
          text: `Your JustBeCause Network verification code is: ${otp}. Valid for 10 minutes.`
        })
        
        const response = await fetch("https://rest.nexmo.com/sms/json", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: vonageParams.toString()
        })
        
        const data = await response.json()
        
        // Vonage returns status "0" for success
        if (data.messages?.[0]?.status !== "0") {
          console.error("Vonage SMS error:", data)
          const errorMessage = data.messages?.[0]?.["error-text"] || "Failed to send SMS"
          const errorStatus = data.messages?.[0]?.status || "unknown"
          
          // Log detailed error for debugging
          console.error(`Vonage Error Status: ${errorStatus}`)
          console.error(`Error Message: ${errorMessage}`)
          console.error(`Phone: ${formattedPhone}, From: ${fromNumber}`)
          
          // Return helpful error in development mode
          if (process.env.NODE_ENV === "development") {
            return NextResponse.json({ 
              success: true, 
              message: `Vonage error (Status ${errorStatus}): ${errorMessage}. OTP generated for testing.`,
              expiresAt: expiresAt.toISOString(),
              devOtp: otp,
              warning: `Vonage error - Status: ${errorStatus}, Message: ${errorMessage}`
            })
          }
          
          throw new Error(`Vonage SMS error (${errorStatus}): ${errorMessage}`)
        }
        
        console.log("✅ Vonage SMS sent successfully!")
        console.log(`   Message ID: ${data.messages?.[0]?.["message-id"]}`)
        console.log(`   Remaining Balance: ${data.messages?.[0]?.["remaining-balance"]}`)
        console.log(`   Message Price: ${data.messages?.[0]?.["message-price"]}`)
      } else {
        console.warn("Vonage selected but not fully configured")
      }
    } else if (smsProvider === "msg91") {
      const authKey = dbConfig.msg91AuthKey || process.env.MSG91_AUTH_KEY
      const senderId = dbConfig.msg91SenderId || process.env.MSG91_SENDER_ID
      const templateId = dbConfig.msg91TemplateId || process.env.MSG91_TEMPLATE_ID
      
      if (authKey && senderId) {
        // Send via MSG91 (popular in India)
        const response = await fetch("https://api.msg91.com/api/v5/otp", {
          method: "POST",
          headers: {
            "authkey": authKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            template_id: templateId,
            mobile: formattedPhone.replace("+", ""),
            otp: otp,
            sender: senderId
          })
        })
        
        if (!response.ok) {
          console.error("MSG91 error:", await response.text())
          throw new Error("Failed to send SMS")
        }
      } else {
        console.warn("MSG91 selected but not fully configured")
      }
    } else if (smsProvider === "textlocal") {
      const apiKey = dbConfig.textlocalApiKey || process.env.TEXTLOCAL_API_KEY
      const sender = dbConfig.textlocalSender || process.env.TEXTLOCAL_SENDER || "VERIFY"
      
      if (apiKey) {
        // Send via TextLocal
        const params = new URLSearchParams({
          apikey: apiKey,
          numbers: formattedPhone.replace("+", ""),
          message: `Your JustBeCause Network verification code is: ${otp}. Valid for 10 minutes.`,
          sender: sender
        })
        
        const response = await fetch(`https://api.textlocal.in/send/?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to send SMS")
        }
      } else {
        console.warn("TextLocal selected but not fully configured")
      }
    } else {
      // No SMS provider configured
      console.error(`[SMS ERROR] No SMS provider configured! Provider value: "${smsProvider}"`)
      
      // In development, return the OTP in response for testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] SMS OTP for ${formattedPhone}: ${otp}`)
        return NextResponse.json({ 
          success: true, 
          message: "OTP sent successfully (dev mode - no SMS provider configured)",
          expiresAt: expiresAt.toISOString(),
          devOtp: otp,
          warning: "No SMS provider configured. Configure one in Admin Settings."
        })
      }
      
      // In production, fail if no provider is configured
      return NextResponse.json({ 
        error: "SMS service not configured. Please contact support." 
      }, { status: 503 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      expiresAt: expiresAt.toISOString()
    })
  } catch (error: any) {
    console.error("Send SMS OTP error:", error)
    // Return the actual error message for better debugging
    const errorMessage = error.message || "Failed to send OTP"
    console.error("[SMS] Returning error to client:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
