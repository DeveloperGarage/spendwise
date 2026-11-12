export type Dashboard = {
  "user": { "id": string, "displayName": string },
  "summary": { "currency": "INR", "net": number, "owed": number, "owe": number },
  "groups": [
    { "id": string, "name": string, "memberCount": number, "balance": number },
    { "id": string, "name": string, "memberCount": number, "balance": number }
  ]
}