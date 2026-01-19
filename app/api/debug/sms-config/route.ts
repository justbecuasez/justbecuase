import { NextResponse } from "next/server"
import { getDb } from "@/lib/database"

/**
 * Debug endpoint to check SMS configuration
 * Access: /api/debug/sms-config
 * This helps diagnose SMS issues in production
 */
export async function GET() {
  try {
    const db = await getDb()
    const configCollection = db.collection("system_config")
    const smsConfig = await configCollection.findOne({ type: "sms" })
    
    if (!smsConfig) {
      return NextResponse.json({
        status: "ERROR",
        message: "No SMS configuration found in database",
        dbConnected: true,
        config: null
      })
    }
    
    const dbConfig = smsConfig.data || {}
    
    // Check Twilio configuration
    const twilioConfig = {
      provider: dbConfig.provider,
      hasAccountSid: !!dbConfig.twilioAccountSid,
      accountSidPrefix: dbConfig.twilioAccountSid?.substring(0, 6),
      hasAuthToken: !!dbConfig.twilioAuthToken,
      authTokenLength: dbConfig.twilioAuthToken?.length,
      phoneNumber: dbConfig.twilioPhoneNumber,
      isConfigured: dbConfig.twilioConfigured
    }
    
    // Check environment variables
    const envConfig = {
      SMS_PROVIDER: process.env.SMS_PROVIDER || "not set",
      HAS_TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      HAS_TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "not set",
      NODE_ENV: process.env.NODE_ENV
    }
    
    // Determine final provider
    const finalProvider = dbConfig.provider || process.env.SMS_PROVIDER || "none"
    
    return NextResponse.json({
      status: "OK",
      dbConnected: true,
      finalProvider,
      database: twilioConfig,
      environment: envConfig,
      recommendation: getFinalRecommendation(twilioConfig, envConfig)
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      message: error.message,
      dbConnected: false
    }, { status: 500 })
  }
}

function getFinalRecommendation(dbConfig: any, envConfig: any) {
  const issues: string[] = []
  
  if (dbConfig.provider !== "twilio" && envConfig.SMS_PROVIDER !== "twilio") {
    issues.push("SMS provider is not set to 'twilio'")
  }
  
  if (!dbConfig.hasAccountSid && !envConfig.HAS_TWILIO_ACCOUNT_SID) {
    issues.push("Twilio Account SID is missing")
  }
  
  if (!dbConfig.hasAuthToken && !envConfig.HAS_TWILIO_AUTH_TOKEN) {
    issues.push("Twilio Auth Token is missing")
  }
  
  if (!dbConfig.phoneNumber && envConfig.TWILIO_PHONE_NUMBER === "not set") {
    issues.push("Twilio Phone Number is missing")
  }
  
  if (issues.length === 0) {
    return "Configuration looks complete. If SMS still fails, check Vercel logs for detailed error."
  }
  
  return issues.join("; ")
}
