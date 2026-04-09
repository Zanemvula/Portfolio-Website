
import { CaseStudy, SkillCategory, Education, TimelineEvent } from './types';

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "00",
    title: "Brand Audit Engine: The 'Antigravity' Matrix",
    category: "Intelligence",
    friction: "Marketing teams lacked a way to quantify brand perception across fragmented platforms (Amazon, G2, Reddit) while simultaneously driving high-quality lead generation. Manual auditing was slow and unscalable.",
    architecture: [
      "Context-Aware Engine: Engineered a dynamic signal capture system that adjusts sources (Amazon, Takealot, G2, Capterra) based on brand category detection.",
      "Lead-Gated UX: Developed a 'Seed Score' teaser system where high-level metrics are public, but forensic details remain locked behind a business-email validation gate.",
      "Automated Reporting: Integrated a branded PDF generation engine with built-in rate-limiting (3 scans/day) to manage API overhead and maintain system integrity."
    ],
    outcome: "Transformed brand auditing into a high-conversion lead generation funnel. Achieved 100% quantification of sentiment across diverse sources while providing actionable PDF intelligence to clients.",
    imageUrl: "https://storage.googleapis.com/portfolio_projimages_beta/Sentiment%20Analyzer%20Image%20.png",
    videoUrl: "https://docs.google.com/videos/d/1Iy9LahQRK0510zdF72Hm7TjRXfLS1a1TQI14YQWRezs/edit?usp=sharing",
    codeSnippet: `// Context-Aware Source Mapping & Rate Limiting
const getSources = (category) => {
  const sourceMatrix = {
    'SaaS': ['G2', 'Capterra', 'Product Hunt'],
    'Product': ['Amazon', 'Takealot', 'eBay'],
    'Service': ['Trustpilot', 'Google Reviews']
  };
  return sourceMatrix[category] || ['Reddit', 'YouTube'];
};

// Rate Limit: 3 scans / 24hr
if (localStorage.getItem('scans_today') >= 3) {
  throw new Error("SCAN_LIMIT_REACHED: System resources reserved.");
}`
  },
  {
    id: "01",
    title: "The 'Fail-Safe' NOV Ecosystem",
    category: "Engineering",
    friction: "Data persistence was failing. Users were clicking ads but losing their GCLID/UTM parameters during multi-page navigation. AJAX-based forms were creating duplicate 'ghost' conversions.",
    architecture: [
      "Persistence: Scripted a 1st-party cookie 'vault' to preserve attribution data for 30 days.",
      "The Bridge: Built a custom GTM-to-Google Sheets bridge, bypassing unreliable form fields.",
      "Validation: Engineered an 'Anti-Duplicate' loop that polls the DOM for a successful server response before firing any tags."
    ],
    outcome: "100% data accuracy. Real-time Slack/Email lead alerts. $0/month overhead by replacing paid third-party connectors with custom Google Apps Script.",
    gallery: [
      "https://ik.imagekit.io/93psan9kd/Final%20Slack%20Message.png",
      "https://ik.imagekit.io/93psan9kd/Final%20Setup%20Confirmation.png",
      "https://ik.imagekit.io/93psan9kd/Final%20CRM%20Image.png",
      "https://ik.imagekit.io/93psan9kd/Final%20Email%20Message.png"
    ],
    deeperDiveUrl: "https://docs.google.com/document/d/129jMVocrDFmmjKNcWs8KkvHF3Frc2PtK1wRQCY0ZJNE/edit?usp=drive_link",
    codeSnippet: `function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  const data = JSON.parse(e.postData.contents);
  const row = [new Date(), data.gclid, data.utm_source, data.email];
  sheet.appendRow(row);
  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}`
  },
  {
    id: "02",
    title: "E-commerce Data Refactoring",
    category: "Analytics",
    friction: "A retail store was reporting triple-duplicate purchases. Legacy hardcoded snippets, conflicting plugins (GLA), and flawed GTM trigger logic were destroying the CPA metrics.",
    architecture: [
      "Performed a forensic audit via GTM Debugger to isolate conflicting script sources.",
      "Purged redundant hardcode and plugin-injected tags.",
      "Implemented strict undefined check filters in the Data Layer to ensure tags only fire when a valid transaction ID is present."
    ],
    outcome: "Reduced triple-duplicate purchases by 100%. Centralized all tracking authority within GTM, enabling reliable automated bidding in Google Ads.",
    deeperDiveUrl: "https://docs.google.com/document/d/1O07lJuXfp1xE2HqFzdQxXKRGmbpiv-K5KhXfmBpalZI/edit?usp=drive_link",
    gallery: [
      "https://ik.imagekit.io/93psan9kd/Screenshot%202025-12-03%20113943.png?updatedAt=1766608247739",
      "https://ik.imagekit.io/93psan9kd/unnamed.png?updatedAt=1766608246909",
      "https://ik.imagekit.io/93psan9kd/Correct%20Config%202.png?updatedAt=1766608246071",
      "https://ik.imagekit.io/93psan9kd/Payfast%20Misconfiguration.png?updatedAt=1766608245290",
      "https://ik.imagekit.io/93psan9kd/Duplicate%20Gtag%20loaded%20by%20an%20Analytics%20Plugin.png?updatedAt=1766608243262",
      "https://ik.imagekit.io/93psan9kd/Return%20To%20Checkout.png?updatedAt=1766608244240",
      "https://ik.imagekit.io/93psan9kd/Payment%20Successful.png?updatedAt=1766608241692",
      "https://ik.imagekit.io/93psan9kd/Sandbox%20Payment.png?updatedAt=1766608239757",
      "https://ik.imagekit.io/93psan9kd/Purchase%20Event%20Now%20Active.png?updatedAt=1766608238052"
    ],
    codeSnippet: `// GTM Custom Template Hook
const transactionId = data.transactionId;
if (transactionId === undefined || transactionId === null) {
  return false; // Prevent tag firing
}
return true;`
  },
  {
    id: "03",
    title: "Automated Sentiment Intelligence",
    category: "Intelligence",
    friction: "A global consumer goods giant was 'blind' to the voice of the customer, with thousands of ad comments going unanalyzed.",
    architecture: [
      "Architected an automated pipeline using Supermetrics to ingest Facebook comments into Google Sheets.",
      "Integrated Google Cloud Natural Language API via Apps Script to extract Sentiment Score and Magnitude.",
      "Visualized live sentiment trends in Looker Studio."
    ],
    outcome: "Real-time quantification of customer satisfaction. Enabled the marketing team to identify and resolve negative feedback drivers before they escalated.",
    gallery: [
      "https://ik.imagekit.io/93psan9kd/Gemini_Generated_Image_4rvg6n4rvg6n4rvg.png",
      "https://ik.imagekit.io/93psan9kd/Gemini_Generated_Image_llbmxollbmxollbm.png"
    ],
    codeSnippet: `const analyzeSentiment = (text) => {
  const url = 'https://language.googleapis.com/v1/documents:analyzeSentiment?key=' + API_KEY;
  const payload = { document: { content: text, type: 'PLAIN_TEXT' } };
  const response = UrlFetchApp.fetch(url, { method: 'POST', payload: JSON.stringify(payload) });
  return JSON.parse(response).documentSentiment.score;
}`
  },
  {
    id: "04",
    title: "Programmable Budget Pacing",
    category: "Automation",
    friction: "Manual budget adjustments across 22+ global accounts were inefficient and prone to human error/overspend.",
    architecture: [
      "Developed a Google Ads Script that performs daily date/spend calculations to determine the 'Ideal Daily Budget' based on remaining monthly funds."
    ],
    outcome: "Automated pacing that increases/decreases daily spend dynamically. Guaranteed budget utilization without the risk of overspending.",
    imageUrl: "https://i.postimg.cc/cCpVybLB/image-(2).png",
    codeSnippet: `function main() {
  const budget = AdsApp.budgets().withIds([123]).get().next();
  const spentThisMonth = getSpentThisMonth();
  const daysRemaining = getDaysRemaining();
  const idealDaily = (TOTAL_MONTHLY - spentThisMonth) / daysRemaining;
  budget.setAmount(idealDaily);
}`
  },
  {
    id: "05",
    title: "Geo-Intent Performance Logic",
    category: "Analytics",
    friction: "A client needed to pinpoint exact keyword intent across the country to answer: 'What are people searching for specifically in those areas?'",
    architecture: [
      "Configured Google Ads tracking templates to pass dynamic dynamic {keyword} and {locationid} as URL parameters.",
      "Synchronized GTM to capture 'kw' and 'lid' parameters and map them to GA4 Custom Dimensions.",
      "Developed a custom Google Apps Script to extract this geo-data from the GA4 Data API into Google Sheets on an hourly schedule."
    ],
    outcome: "An automated Looker Studio dashboard featuring custom Vega-JSON word clouds and intent tables. Enabled localized keyword strategy and geographic targeting decisions.",
    videoUrl: "https://drive.google.com/file/d/1q6C9-tyKu2xL0sJWpxOzeIFaCATX8A68/view?usp=sharing",
    deeperDiveUrl: "https://docs.google.com/document/d/11F7dLIV83ZQqKX7xEo3bKaLfWTjmMTw4FwiOuDWXj8g/edit?usp=sharing",
    gallery: [
      "https://ik.imagekit.io/93psan9kd/Screenshot%202025-12-25%20005425.png",
      
    ],
    imageUrl: "https://ik.imagekit.io/93psan9kd/Screenshot%202025-12-25%20005402.png",
    codeSnippet: `function getGA4Data() {
  const SPREADSHEET_NAME = 'PERFORMANCE_DATA';
  const PROPERTY_ID = 'YOUR_PROPERTY_ID'; 
  const dimensions = [
    { name: 'date' },
    { name: 'city' },
    { name: 'country' },
    { name: 'sessionGoogleAdsKeywordText' },
    { name: 'customDimension.kw' }, 
    { name: 'customDimension.lid' }
  ];
  const request = {
    'dimensions': dimensions,
    'dateRanges': [{'startDate': '2025-05-01', 'endDate': 'today'}]
  };
  const report = AnalyticsData.Properties.runReport(request, 'properties/' + PROPERTY_ID);
  // ... (Report rendering logic)
}`
  },
  {
    id: "06",
    title: "Counter-Seasonal Lead Architecture",
    category: "Strategy",
    friction: "December is traditionally a 'dead zone' for construction. High ad costs, low intent, and 'December Fatigue' usually result in wasted spend. The challenge was to capture high-value prospects during the festive slowdown without pushing for impossible immediate sales.",
    architecture: [
      "Strategic Pivot: Replaced 'Buy Now' urgency with a 'First in Line for 2026' priority access offer, reframing the lead as 'planning' rather than 'buying'.",
      "Friction Reduction: Implemented Google Lead Form extensions to bypass landing page latency and capture intent directly on the SERP.",
      "Quality Gate: Engineered budget qualification questions directly into the form logic to filter for high-intent pipelines and auto-calculate potential revenue."
    ],
    outcome: "Generated R662,501 in pipeline value with a 77.1x ROAS. Achieved a CPL of R716.24 during the most expensive ad season of the year, proving that 'dead' periods are actually 'planning' periods.",
    deeperDiveUrl: "https://docs.google.com/document/d/1Jsn9Jpce5Sx30hRxNSsGGeE2jihpRRv0UAJ-eYbbgr8/edit?tab=t.0",
    gallery: [
      "https://ik.imagekit.io/93psan9kd/Screenshot%202026-01-07%20133714.png",
      "https://ik.imagekit.io/93psan9kd/c9a9522f-8bd0-4516-8396-5c85a44b6ee0.png",
      "https://ik.imagekit.io/93psan9kd/Screenshot%202026-01-07%20135456.png"
    ],
    codeSnippet: `// Pipeline Value Calculation Logic
const calculatePipeline = (leads) => {
  const totalValue = leads.reduce((acc, lead) => {
    // Budget qualification field from Lead Form
    const budget = extractBudget(lead.form_inputs.budget_range);
    return acc + (budget || 0);
  }, 0);

  const adSpend = 8594.83;
  const roas = totalValue / adSpend; // Result: 77.1x

  return {
    pipeline: \`R\${totalValue.toLocaleString()}\`,
    roas: \`\${roas.toFixed(1)}x\`
  };
}`
  }
];

export const STACK: SkillCategory[] = [
  {
    title: "Scripting & Integration",
    skills: ["JavaScript (Basic)", "JSON", "REST APIs", "Google Apps Script"]
  },
  {
    title: "Data Infrastructure",
    skills: ["GTM (Advanced)", "GA4","Looker Studio", "SQL", "Google BigQuery (Working Knowledge)"]
  },
  {
    title: "Automation Platforms",
    skills: ["Zapier", "n8n", "OpenAI API"]
  },
  {
    title: "Core Platforms",
    skills: ["Google Ads Suite", "Meta Ads", "Microsoft Ads", "WooCommerce", "WordPress", "Shopify"]
  }
];

export const ACADEMICS: Education[] = [
  {
    degree: "Bachelor of Honours in Marketing",
    institution: "University of the Witwatersrand",
    period: "2024"
  },
  {
    degree: "Bachelor of Commerce in Information Systems",
    institution: "University of the Witwatersrand",
    period: "2023"
  }
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "t1",
    date: "2023 Q4",
    label: "B.Com Information Systems",
    category: "academic",
    description: "Completed foundation in systems architecture and database management at Wits University.",
    details: ["Focused on SQL and relational databases.", "Advanced business process optimization modules.", "Built initial scripts for automated data extraction."]
  },
  {
    id: "t2",
    date: "2024 NOV",
    label: "Honours in Marketing Completion",
    category: "academic",
    description: "Started specialized study in technical marketing strategy and consumer behavior statistics.",
    details: ["Advanced research methodology focus.", "Statistical analysis using R and advanced spreadsheet logic.", "Strategic brand positioning framework development."]
  },
  {
    id: "t3",
    date: "2024 NOV",
    label: "Programmable Budget Scripting",
    category: "skill",
    description: "Automated spend management for 33+ global accounts. Managing R1 million per month on average",
    details: ["Developed Google Ads Scripts for dynamic pacing.", "Reduced manual monitoring overhead by 90%.", "Eliminated budget overspend risk."]
  },
  {
    id: "t4",
    date: "2025 MAY",
    label: "Sentiment Intelligence Pipeline",
    category: "project",
    description: "Built an NLP-powered consumer feedback engine.",
    details: ["Integrated Google Cloud Natural Language API.", "Automated social media comment ingestion.", "Live Looker Studio sentiment visualization."]
  },
  {
    id: "t5",
    date: "2025 JUL",
    label: "Geo-Intent Performance Dashboard",
    category: "project",
    description: "Automated reporting workflow for localized keyword analysis.",
    details: ["Custom Ads Tracking Templates.", "GA4 Custom Dimension mapping via GTM.", "Hourly extraction via Google Apps Script."]
  },
  {
    id: "t6",
    date: "2025 NOV",
    label: "WooCommerce Data Refactoring",
    category: "project",
    description: "Resolved critical data inflation issues for a retail client.",
    details: ["Eliminated 300% conversion duplication.", "Isolated conflicting GLA plugins.", "Centralized tracking within GTM container."]
  },
  {
    id: "t7",
    date: "2025 NOV",
    label: "NOV Ecosystem Deployment",
    category: "project",
    description: "Engineered a fail-safe serverless attribution bridge.",
    details: ["1st-party cookie 'vault' development.", "Automated lead flow to Google Sheets via Apps Script.", "Zero-cost maintenance architecture."]
  }
];