import {Groups} from "@/domain/models/group";


export type Dashboard = {
  "user": { "id": string, "displayName": string },
  "summary": { "currency": "INR", "net": number, "owed": number, "owe": number },
  "groups": Groups
}