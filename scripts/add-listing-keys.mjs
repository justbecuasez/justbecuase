import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enPath = resolve(__dirname, '../app/[lang]/dictionaries/en.json');
const hiPath = resolve(__dirname, '../app/[lang]/dictionaries/hi.json');

const en = JSON.parse(readFileSync(enPath, 'utf8'));
const hi = JSON.parse(readFileSync(hiPath, 'utf8'));

// ===== PROJECTS LISTING =====
const projectsListingEN = {
  title: "Browse Opportunities",
  subtitle: "Find opportunities that match your skills and interests",
  searchPlaceholder: "Search opportunities, skills, or organizations...",
  filters: "Filters",
  sortBy: "Sort by",
  newestFirst: "Newest First",
  mostRelevant: "Most Relevant",
  closingSoon: "Closing Soon",
  mostPopular: "Most Popular",
  activeFilters: "Active filters:",
  showing: "Showing",
  of: "of",
  opportunities: "opportunities",
  showingTemplate: "Showing {shown} of {total} opportunities",
  noOpportunitiesFound: "No opportunities found",
  tryAdjustingFilters: "Try adjusting your filters",
  checkBackLater: "Check back later for new opportunities",
  clearFilters: "Clear Filters",
  clearAllFilters: "Clear all filters",
  loadMore: "Load More Opportunities",
  skills: "Skills",
  skillsCount: "({count} skills)",
  timeCommitment: "Time Commitment",
  location: "Location",
  allLocations: "All locations",
  hours1to5: "1-5 hours/week",
  hours5to10: "5-10 hours/week",
  hours10to20: "10-20 hours/week",
  hours20plus: "20+ hours/week",
  remote: "Remote",
  onSite: "On-site",
  hybrid: "Hybrid",
  recently: "Recently",
  ngoFallback: "NGO"
};

const projectsListingHI = {
  title: "अवसर ब्राउज़ करें",
  subtitle: "अपने कौशल और रुचियों से मेल खाने वाले अवसर खोजें",
  searchPlaceholder: "अवसर, कौशल, या संगठन खोजें...",
  filters: "फ़िल्टर",
  sortBy: "क्रमबद्ध करें",
  newestFirst: "नवीनतम पहले",
  mostRelevant: "सबसे प्रासंगिक",
  closingSoon: "जल्द बंद हो रहे",
  mostPopular: "सबसे लोकप्रिय",
  activeFilters: "सक्रिय फ़िल्टर:",
  showing: "दिखा रहा है",
  of: "में से",
  opportunities: "अवसर",
  showingTemplate: "{total} में से {shown} अवसर दिखा रहे हैं",
  noOpportunitiesFound: "कोई अवसर नहीं मिला",
  tryAdjustingFilters: "अपने फ़िल्टर समायोजित करने का प्रयास करें",
  checkBackLater: "नए अवसरों के लिए बाद में देखें",
  clearFilters: "फ़िल्टर साफ़ करें",
  clearAllFilters: "सभी फ़िल्टर साफ़ करें",
  loadMore: "और अवसर लोड करें",
  skills: "कौशल",
  skillsCount: "({count} कौशल)",
  timeCommitment: "समय प्रतिबद्धता",
  location: "स्थान",
  allLocations: "सभी स्थान",
  hours1to5: "1-5 घंटे/सप्ताह",
  hours5to10: "5-10 घंटे/सप्ताह",
  hours10to20: "10-20 घंटे/सप्ताह",
  hours20plus: "20+ घंटे/सप्ताह",
  remote: "रिमोट",
  onSite: "ऑन-साइट",
  hybrid: "हाइब्रिड",
  recently: "हाल ही में",
  ngoFallback: "एनजीओ"
};

// ===== PROJECT DETAIL =====
const projectDetailEN = {
  flexible: "Flexible",
  backToOpportunities: "Back to Opportunities",
  verifiedOrganization: "Verified Organization",
  organization: "Organization",
  opportunityDescription: "Opportunity Description",
  skillsRequired: "Skills Required",
  noSkillsRequired: "No specific skills required",
  experienceLevel: "Experience Level",
  causes: "Causes",
  opportunityDocuments: "Opportunity Documents",
  aboutOrg: "About {name}",
  orgFallbackDesc: "{name} is a registered nonprofit organization working to make a positive impact.",
  viewOrgProfile: "View Organization Profile →",
  timeCommitment: "Time Commitment",
  duration: "Duration",
  deadline: "Deadline",
  workMode: "Work Mode",
  applications: "Applications",
  opportunityCompleted: "Opportunity Completed",
  applicationsClosed: "Applications Closed",
  notAccepting: "Not Accepting Applications",
  viewedCount: "{count} people viewed this opportunity",
  similarOpportunities: "Similar Opportunities"
};

const projectDetailHI = {
  flexible: "लचीला",
  backToOpportunities: "अवसरों पर वापस जाएं",
  verifiedOrganization: "सत्यापित संगठन",
  organization: "संगठन",
  opportunityDescription: "अवसर विवरण",
  skillsRequired: "आवश्यक कौशल",
  noSkillsRequired: "कोई विशेष कौशल आवश्यक नहीं",
  experienceLevel: "अनुभव स्तर",
  causes: "कारण",
  opportunityDocuments: "अवसर दस्तावेज़",
  aboutOrg: "{name} के बारे में",
  orgFallbackDesc: "{name} एक पंजीकृत गैर-लाभकारी संगठन है जो सकारात्मक प्रभाव बनाने के लिए काम कर रहा है।",
  viewOrgProfile: "संगठन प्रोफ़ाइल देखें →",
  timeCommitment: "समय प्रतिबद्धता",
  duration: "अवधि",
  deadline: "समय सीमा",
  workMode: "कार्य मोड",
  applications: "आवेदन",
  opportunityCompleted: "अवसर पूर्ण",
  applicationsClosed: "आवेदन बंद",
  notAccepting: "आवेदन स्वीकार नहीं कर रहे",
  viewedCount: "{count} लोगों ने यह अवसर देखा",
  similarOpportunities: "समान अवसर"
};

// ===== VOLUNTEERS LISTING =====
const volunteersListingEN = {
  title: "Find Skilled Impact Agents",
  subtitle: "Connect with talented professionals ready to contribute their skills to your cause",
  searchPlaceholder: "Search by skills, location, or name...",
  filters: "Filters",
  sortBy: "Sort by",
  bestMatch: "Best Match",
  highestRated: "Highest Rated",
  mostExperienced: "Most Experienced",
  mostHours: "Most Hours",
  activeFilters: "Active filters:",
  showingTemplate: "Showing {shown} of {total} impact agents",
  noAgentsFound: "No impact agents found",
  tryAdjusting: "Try adjusting your filters or search terms",
  checkBackLater: "Check back later for new impact agents",
  clearFilters: "Clear Filters",
  clearAllFilters: "Clear all filters",
  impactAgentType: "Impact Agent Type",
  allImpactAgents: "All Impact Agents",
  proBono: "Pro Bono",
  paid: "Paid",
  openToBoth: "Open to Both",
  both: "Both",
  workMode: "Work Mode",
  any: "Any",
  remote: "Remote",
  onSite: "On-site",
  hybridMode: "Hybrid",
  skills: "Skills",
  causes: "Causes"
};

const volunteersListingHI = {
  title: "कुशल इम्पैक्ट एजेंट खोजें",
  subtitle: "अपने कारण में अपने कौशल का योगदान देने के लिए तैयार प्रतिभाशाली पेशेवरों से जुड़ें",
  searchPlaceholder: "कौशल, स्थान, या नाम से खोजें...",
  filters: "फ़िल्टर",
  sortBy: "क्रमबद्ध करें",
  bestMatch: "सर्वश्रेष्ठ मिलान",
  highestRated: "सबसे अधिक रेटेड",
  mostExperienced: "सबसे अनुभवी",
  mostHours: "सबसे अधिक घंटे",
  activeFilters: "सक्रिय फ़िल्टर:",
  showingTemplate: "{total} में से {shown} इम्पैक्ट एजेंट दिखा रहे हैं",
  noAgentsFound: "कोई इम्पैक्ट एजेंट नहीं मिला",
  tryAdjusting: "अपने फ़िल्टर या खोज शर्तों को समायोजित करें",
  checkBackLater: "नए इम्पैक्ट एजेंट के लिए बाद में देखें",
  clearFilters: "फ़िल्टर साफ़ करें",
  clearAllFilters: "सभी फ़िल्टर साफ़ करें",
  impactAgentType: "इम्पैक्ट एजेंट प्रकार",
  allImpactAgents: "सभी इम्पैक्ट एजेंट",
  proBono: "प्रो बोनो",
  paid: "भुगतान",
  openToBoth: "दोनों के लिए तैयार",
  both: "दोनों",
  workMode: "कार्य मोड",
  any: "कोई भी",
  remote: "रिमोट",
  onSite: "ऑन-साइट",
  hybridMode: "हाइब्रिड",
  skills: "कौशल",
  causes: "कारण"
};

// ===== VOLUNTEER DETAIL =====
const volunteerDetailEN = {
  impactAgent: "Impact Agent",
  profileLocked: "Profile Locked",
  locationNotSpecified: "Location not specified",
  ratingLabel: "{rating} rating",
  opportunitiesCompleted: "{count} opportunities completed",
  paidBadge: "Paid",
  proBonoLabel: "Pro Bono",
  freeAndPaid: "Free & Paid",
  freeHoursMonth: "{hours} hrs/month free",
  plusMore: "+{count} more",
  subscribeToView: "Subscribe to View",
  shareTitle: "Skilled Impact Agent on JustBeCause",
  shareTitleWithName: "{name} - Impact Agent Profile",
  shareDescription: "Discover this talented impact agent with {projects} completed projects and a {rating} rating.",
  proRequired: "Pro Subscription Required",
  proRequiredDesc: "This is a free impact agent. Subscribe to our Pro plan to view their full profile, contact details, portfolio, and connect with them directly.",
  upgradeToPro: "Upgrade to Pro",
  aboutTitle: "About",
  subscribeToBio: "Subscribe to Pro to view full bio",
  noBioYet: "No bio provided yet.",
  skillsExpertise: "Skills & Expertise",
  noSkillsYet: "No skills listed yet.",
  reviewsRatings: "Reviews & Ratings",
  causesCareAbout: "Causes They Care About",
  noCausesYet: "No causes specified yet.",
  impactSummary: "Impact Summary",
  hoursContributed: "Hours Contributed",
  projectsCompleted: "Projects Completed",
  estimatedValue: "Estimated Value",
  workPreferences: "Work Preferences",
  workModeLabel: "Work Mode",
  hoursPerWeek: "Hours/Week",
  hourlyRate: "Hourly Rate",
  ngoDiscountRate: "NGO Discounted Rate",
  achievements: "Achievements",
  topRated: "Top Rated",
  topRatedDesc: "{rating}+ rating",
  hours100: "100+ Hours",
  hours100Desc: "Impact Agent milestone",
  projects10: "10+ Projects",
  projects10Desc: "Completed milestone",
  verified: "Verified",
  verifiedDesc: "Identity confirmed",
  noAchievements: "No achievements yet. Complete projects to earn badges!",
  connect: "Connect",
  linkedInProfile: "LinkedIn Profile",
  portfolioWebsite: "Portfolio Website"
};

const volunteerDetailHI = {
  impactAgent: "इम्पैक्ट एजेंट",
  profileLocked: "प्रोफ़ाइल लॉक है",
  locationNotSpecified: "स्थान निर्दिष्ट नहीं",
  ratingLabel: "{rating} रेटिंग",
  opportunitiesCompleted: "{count} अवसर पूर्ण",
  paidBadge: "सशुल्क",
  proBonoLabel: "प्रो बोनो",
  freeAndPaid: "नि:शुल्क और सशुल्क",
  freeHoursMonth: "{hours} घंटे/माह नि:शुल्क",
  plusMore: "+{count} और",
  subscribeToView: "देखने के लिए सब्सक्राइब करें",
  shareTitle: "JustBeCause पर कुशल इम्पैक्ट एजेंट",
  shareTitleWithName: "{name} - इम्पैक्ट एजेंट प्रोफ़ाइल",
  shareDescription: "{projects} पूर्ण परियोजनाओं और {rating} रेटिंग वाले इस प्रतिभाशाली इम्पैक्ट एजेंट को खोजें।",
  proRequired: "प्रो सब्सक्रिप्शन आवश्यक",
  proRequiredDesc: "यह एक नि:शुल्क इम्पैक्ट एजेंट है। उनकी पूरी प्रोफ़ाइल, संपर्क विवरण, पोर्टफोलियो देखने और सीधे जुड़ने के लिए हमारी प्रो योजना की सदस्यता लें।",
  upgradeToPro: "प्रो में अपग्रेड करें",
  aboutTitle: "परिचय",
  subscribeToBio: "पूरा बायो देखने के लिए प्रो सब्सक्राइब करें",
  noBioYet: "अभी तक कोई बायो नहीं दिया गया।",
  skillsExpertise: "कौशल और विशेषज्ञता",
  noSkillsYet: "अभी तक कोई कौशल सूचीबद्ध नहीं।",
  reviewsRatings: "समीक्षाएं और रेटिंग",
  causesCareAbout: "जिन कारणों की उन्हें परवाह है",
  noCausesYet: "अभी तक कोई कारण निर्दिष्ट नहीं।",
  impactSummary: "प्रभाव सारांश",
  hoursContributed: "योगदान किए गए घंटे",
  projectsCompleted: "पूर्ण परियोजनाएं",
  estimatedValue: "अनुमानित मूल्य",
  workPreferences: "कार्य प्राथमिकताएं",
  workModeLabel: "कार्य मोड",
  hoursPerWeek: "घंटे/सप्ताह",
  hourlyRate: "प्रति घंटा दर",
  ngoDiscountRate: "एनजीओ छूट दर",
  achievements: "उपलब्धियां",
  topRated: "शीर्ष रेटेड",
  topRatedDesc: "{rating}+ रेटिंग",
  hours100: "100+ घंटे",
  hours100Desc: "इम्पैक्ट एजेंट उपलब्धि",
  projects10: "10+ परियोजनाएं",
  projects10Desc: "पूर्ण उपलब्धि",
  verified: "सत्यापित",
  verifiedDesc: "पहचान की पुष्टि",
  noAchievements: "अभी तक कोई उपलब्धि नहीं। बैज अर्जित करने के लिए परियोजनाएं पूरी करें!",
  connect: "जुड़ें",
  linkedInProfile: "लिंक्डइन प्रोफ़ाइल",
  portfolioWebsite: "पोर्टफोलियो वेबसाइट"
};

// ===== NGO DETAIL =====
const ngoDetailEN = {
  projectsPosted: "{count} projects posted",
  shareDescription: "Discover {name} and their impactful projects on JustBeCause.",
  visitWebsite: "Visit Website",
  aboutOrg: "About {name}",
  orgFallbackDesc: "{name} is a registered nonprofit organization working to create positive change in communities.",
  mission: "Mission",
  openProjects: "Open Projects ({count})",
  viewAll: "View All",
  applicantsCount: "{count} applicants",
  noOpenOpportunities: "No Open Opportunities",
  noOpenOpportunitiesDesc: "This organization doesn't have any open opportunities at the moment.",
  skillsLookingFor: "Skills They're Looking For",
  impact: "Impact",
  projectsPostedStat: "Projects Posted",
  impactAgents: "Impact Agents",
  valueCreated: "Value Created",
  orgDetails: "Organization Details",
  registration: "Registration",
  teamSize: "Team Size",
  status: "Status",
  verifiedBadge: "Verified",
  pendingVerification: "Pending Verification",
  memberSince: "Member Since",
  connect: "Connect",
  website: "Website",
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn"
};

const ngoDetailHI = {
  projectsPosted: "{count} परियोजनाएं पोस्ट की गईं",
  shareDescription: "JustBeCause पर {name} और उनकी प्रभावशाली परियोजनाओं को खोजें।",
  visitWebsite: "वेबसाइट पर जाएं",
  aboutOrg: "{name} के बारे में",
  orgFallbackDesc: "{name} एक पंजीकृत गैर-लाभकारी संगठन है जो समुदायों में सकारात्मक बदलाव लाने के लिए काम कर रहा है।",
  mission: "मिशन",
  openProjects: "खुली परियोजनाएं ({count})",
  viewAll: "सभी देखें",
  applicantsCount: "{count} आवेदक",
  noOpenOpportunities: "कोई खुला अवसर नहीं",
  noOpenOpportunitiesDesc: "इस संगठन के पास इस समय कोई खुला अवसर नहीं है।",
  skillsLookingFor: "जिन कौशलों की वे तलाश कर रहे हैं",
  impact: "प्रभाव",
  projectsPostedStat: "परियोजनाएं पोस्ट",
  impactAgents: "इम्पैक्ट एजेंट",
  valueCreated: "बनाया गया मूल्य",
  orgDetails: "संगठन विवरण",
  registration: "पंजीकरण",
  teamSize: "टीम का आकार",
  status: "स्थिति",
  verifiedBadge: "सत्यापित",
  pendingVerification: "सत्यापन लंबित",
  memberSince: "सदस्य तब से",
  connect: "जुड़ें",
  website: "वेबसाइट",
  email: "ईमेल",
  phone: "फ़ोन",
  linkedin: "लिंक्डइन"
};

// ===== CHECKOUT =====
const checkoutEN = {
  ngoPlanName: "NGO Pro Plan",
  ngoPlanDesc: "Unlimited projects and profile unlocks for your organization",
  ngoFeature1: "Unlimited projects",
  ngoFeature2: "Unlimited profile unlocks",
  ngoFeature3: "Advanced AI-powered matching",
  ngoFeature4: "Priority support",
  ngoFeature5: "Project analytics & reports",
  ngoFeature6: "Featured NGO badge",
  agentPlanName: "Impact Agent Pro Plan",
  agentPlanDesc: "Unlimited applications and premium features",
  agentFeature1: "Unlimited job applications",
  agentFeature2: "Featured profile badge",
  agentFeature3: "Priority in search results",
  agentFeature4: "Direct message NGOs",
  agentFeature5: "Early access to opportunities",
  agentFeature6: "Profile analytics",
  agentFeature7: "Certificate downloads",
  invalidCoupon: "Invalid coupon code",
  couponApplied: "Coupon applied!",
  percentOff: "{percent}% off applied",
  amountOff: "{symbol}{amount} off applied",
  couponValidateFailed: "Failed to validate coupon",
  paymentInitFailed: "Failed to initialise payment",
  networkError: "Network error — please try again",
  invalidPlan: "Invalid Plan",
  noPlanSelected: "No plan selected. Please choose a plan from the pricing page.",
  viewPricing: "View Pricing",
  roleMismatch: "Role Mismatch",
  roleMismatchDesc: "This plan is for {expected}s. Your role doesn't match.",
  alreadySubscribed: "Already Subscribed",
  alreadySubscribedDesc: "You're already on the Pro plan!",
  goToDashboard: "Go to Dashboard",
  backToPricing: "Back to Pricing",
  haveCoupon: "Have a coupon code?",
  percentOffLabel: "% off",
  amountOffLabel: "{symbol}{amount} off",
  enterCode: "Enter code",
  apply: "Apply",
  youSave: "You save {amount} on this order!",
  orderSummary: "Order Summary",
  perMonth: "/mo",
  couponLabel: "Coupon ({code})",
  total: "Total",
  youSaveCoupon: "You save {amount} with coupon!",
  paymentDetails: "Payment Details",
  retry: "Retry",
  preparingPayment: "Preparing secure payment…",
  sslEncrypted: "SSL Encrypted",
  poweredByStripe: "Powered by Stripe",
  activating: "Activating your subscription…",
  paymentSuccessful: "Payment successful!",
  proActive: "Your Pro plan is now active.",
  activationFailed: "Payment succeeded but activation failed. Please contact support.",
  unexpectedStatus: "Unexpected payment status: {status}. Please contact support.",
  unexpectedError: "An unexpected error occurred",
  paymentFailed: "Payment failed. Please check your details and try again.",
  processing: "Processing…",
  payAmount: "Pay {amount}",
  roleNGO: "NGO",
  roleAgent: "Impact Agent"
};

const checkoutHI = {
  ngoPlanName: "एनजीओ प्रो प्लान",
  ngoPlanDesc: "आपके संगठन के लिए असीमित परियोजनाएं और प्रोफ़ाइल अनलॉक",
  ngoFeature1: "असीमित परियोजनाएं",
  ngoFeature2: "असीमित प्रोफ़ाइल अनलॉक",
  ngoFeature3: "उन्नत AI-संचालित मिलान",
  ngoFeature4: "प्राथमिकता सहायता",
  ngoFeature5: "परियोजना विश्लेषण और रिपोर्ट",
  ngoFeature6: "विशेष एनजीओ बैज",
  agentPlanName: "इम्पैक्ट एजेंट प्रो प्लान",
  agentPlanDesc: "असीमित आवेदन और प्रीमियम सुविधाएं",
  agentFeature1: "असीमित नौकरी आवेदन",
  agentFeature2: "विशेष प्रोफ़ाइल बैज",
  agentFeature3: "खोज परिणामों में प्राथमिकता",
  agentFeature4: "एनजीओ को सीधे संदेश भेजें",
  agentFeature5: "अवसरों तक जल्दी पहुंच",
  agentFeature6: "प्रोफ़ाइल विश्लेषण",
  agentFeature7: "प्रमाणपत्र डाउनलोड",
  invalidCoupon: "अमान्य कूपन कोड",
  couponApplied: "कूपन लागू किया गया!",
  percentOff: "{percent}% छूट लागू",
  amountOff: "{symbol}{amount} छूट लागू",
  couponValidateFailed: "कूपन सत्यापन विफल",
  paymentInitFailed: "भुगतान शुरू करने में विफल",
  networkError: "नेटवर्क त्रुटि — कृपया पुनः प्रयास करें",
  invalidPlan: "अमान्य योजना",
  noPlanSelected: "कोई योजना चयनित नहीं है। कृपया मूल्य पृष्ठ से एक योजना चुनें।",
  viewPricing: "मूल्य देखें",
  roleMismatch: "भूमिका बेमेल",
  roleMismatchDesc: "यह योजना {expected} के लिए है। आपकी भूमिका मेल नहीं खाती।",
  alreadySubscribed: "पहले से सब्सक्राइब्ड",
  alreadySubscribedDesc: "आप पहले से प्रो प्लान पर हैं!",
  goToDashboard: "डैशबोर्ड पर जाएं",
  backToPricing: "मूल्य पर वापस जाएं",
  haveCoupon: "कूपन कोड है?",
  percentOffLabel: "% छूट",
  amountOffLabel: "{symbol}{amount} छूट",
  enterCode: "कोड दर्ज करें",
  apply: "लागू करें",
  youSave: "आप इस ऑर्डर पर {amount} बचाते हैं!",
  orderSummary: "ऑर्डर सारांश",
  perMonth: "/माह",
  couponLabel: "कूपन ({code})",
  total: "कुल",
  youSaveCoupon: "आप कूपन से {amount} बचाते हैं!",
  paymentDetails: "भुगतान विवरण",
  retry: "पुनः प्रयास करें",
  preparingPayment: "सुरक्षित भुगतान तैयार हो रहा है…",
  sslEncrypted: "SSL एन्क्रिप्टेड",
  poweredByStripe: "Stripe द्वारा संचालित",
  activating: "आपकी सदस्यता सक्रिय हो रही है…",
  paymentSuccessful: "भुगतान सफल!",
  proActive: "आपका प्रो प्लान अब सक्रिय है।",
  activationFailed: "भुगतान सफल हुआ लेकिन सक्रियण विफल। कृपया सहायता से संपर्क करें।",
  unexpectedStatus: "अप्रत्याशित भुगतान स्थिति: {status}। कृपया सहायता से संपर्क करें।",
  unexpectedError: "एक अप्रत्याशित त्रुटि हुई",
  paymentFailed: "भुगतान विफल। कृपया अपने विवरण जांचें और पुनः प्रयास करें।",
  processing: "प्रोसेसिंग…",
  payAmount: "{amount} भुगतान करें",
  roleNGO: "एनजीओ",
  roleAgent: "इम्पैक्ट एजेंट"
};

// Inject into dictionaries
en.projectsListing = projectsListingEN;
en.projectDetail = projectDetailEN;
en.volunteersListing = volunteersListingEN;
en.volunteerDetail = volunteerDetailEN;
en.ngoDetail = ngoDetailEN;
en.checkout = checkoutEN;

hi.projectsListing = projectsListingHI;
hi.projectDetail = projectDetailHI;
hi.volunteersListing = volunteersListingHI;
hi.volunteerDetail = volunteerDetailHI;
hi.ngoDetail = ngoDetailHI;
hi.checkout = checkoutHI;

writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
writeFileSync(hiPath, JSON.stringify(hi, null, 2) + '\n', 'utf8');

// Count leaf keys
function countLeafKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countLeafKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

const enCount = countLeafKeys(en);
const hiCount = countLeafKeys(hi);

console.log(`EN leaf keys: ${enCount}`);
console.log(`HI leaf keys: ${hiCount}`);
console.log(`Parity: ${enCount === hiCount ? 'PERFECT ✅' : 'MISMATCH ❌'}`);
console.log(`New sections added: projectsListing, projectDetail, volunteersListing, volunteerDetail, ngoDetail, checkout`);
console.log(`projectsListing keys: ${countLeafKeys(projectsListingEN)}`);
console.log(`projectDetail keys: ${countLeafKeys(projectDetailEN)}`);
console.log(`volunteersListing keys: ${countLeafKeys(volunteersListingEN)}`);
console.log(`volunteerDetail keys: ${countLeafKeys(volunteerDetailEN)}`);
console.log(`ngoDetail keys: ${countLeafKeys(ngoDetailEN)}`);
console.log(`checkout keys: ${countLeafKeys(checkoutEN)}`);
