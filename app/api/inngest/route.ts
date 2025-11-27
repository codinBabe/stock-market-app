import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  checkAndSendPriceAlerts,
  sendDailyNewsSummary,
  sendSignupEmail,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendSignupEmail, sendDailyNewsSummary, checkAndSendPriceAlerts],
});
