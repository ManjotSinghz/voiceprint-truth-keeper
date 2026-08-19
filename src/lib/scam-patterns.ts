/** Educational content for the Common Scam Patterns page. Static data. */

export interface ScamPattern {
  id: string;
  title: string;
  description: string;
  redFlags: string[];
}

export const scamPatterns: ScamPattern[] = [
  {
    id: "relative",
    title: "Fake relative in an emergency",
    description:
      "A cloned voice of a son, daughter or grandchild calls in distress — an accident, a hospital, a police station — and needs money transferred immediately.",
    redFlags: [
      "Extreme urgency and emotional pressure",
      "Asks you not to tell other family members",
      "Payment by UPI, gift cards or crypto",
      "Refuses or avoids a video call",
      "Calls from an unknown or masked number",
    ],
  },
  {
    id: "bank",
    title: "Fake bank fraud alert",
    description:
      "A confident 'bank officer' voice warns that your account is compromised and walks you through 'securing' it — which really means handing over OTPs or moving money.",
    redFlags: [
      "Asks for an OTP, PIN or CVV",
      "Wants you to move funds to a 'safe account'",
      "Threatens instant account freeze",
      "Caller ID looks like the bank but call is inbound",
      "Pushes you to install a remote-access app",
    ],
  },
  {
    id: "boss",
    title: "Fake boss / CEO transfer request",
    description:
      "A short cloned clip of a manager's voice authorises an urgent vendor payment, usually just before a weekend or holiday.",
    redFlags: [
      "Request skips the normal approval process",
      "New or changed bank details",
      "Insists on secrecy about the deal",
      "Voice note only, no meeting or email thread",
      "Timed right before end of business hours",
    ],
  },
  {
    id: "police",
    title: "Fake police or 'digital arrest' call",
    description:
      "An authoritative voice claims your identity was used in a crime and keeps you on the line until you pay a 'verification deposit'.",
    redFlags: [
      "Threat of immediate arrest over the phone",
      "Orders you to stay on the call continuously",
      "Demands payment to 'clear your name'",
      "Uses official-sounding case numbers",
      "Discourages you from calling a lawyer",
    ],
  },
  {
    id: "kyc",
    title: "Fake KYC / SIM re-verification",
    description:
      "A telecom or utility 'agent' says your service will be disconnected within hours unless you complete verification right now.",
    redFlags: [
      "Deadline measured in hours",
      "Link sent over SMS or WhatsApp",
      "Asks for Aadhaar or full card number",
      "Small 'verification fee' requested",
      "Cannot give a callback number",
    ],
  },
  {
    id: "voicemail",
    title: "Cloned voicemail callback trap",
    description:
      "You receive a voice message that sounds like someone you know, asking you to call back a different number where the real scam starts.",
    redFlags: [
      "Callback number differs from the saved contact",
      "Message is short and slightly robotic",
      "No reference to anything only they would know",
      "Background is unnaturally silent",
      "Follow-up pressure if you delay",
    ],
  },
];
