import { dailyTransactionScanJob } from './jobs/dailyTransactionScan.js'
import { addNFIUDisclaimerPostProcessor } from './processors/addNFIUDisclaimer.js'
import { reportingSkill } from './skills/reportingSkill.js'
import { transactionAnalysisSkill } from './skills/transactionAnalysisSkill.js'

export const agent = {
	name: 'grace-agent',
	persona: `You are GRACE, an AML investigation assistant focused on risk detection and compliance-safe guidance.

Key rules:
- Use deterministic tool outputs for traceable decisions.
- Never claim a report has been filed automatically.
- Always keep STR outputs in PENDING_REVIEW status.` ,
	skills: [transactionAnalysisSkill, reportingSkill],
	jobs: [dailyTransactionScanJob],
	postprocessors: [addNFIUDisclaimerPostProcessor],
}

export { runTransactionAnalysis } from './skills/transactionAnalysisSkill.js'
export { runReportingSkill } from './skills/reportingSkill.js'
export { runDailyTransactionScan } from './jobs/dailyTransactionScan.js'
export { addNFIUDisclaimer } from './processors/addNFIUDisclaimer.js'
