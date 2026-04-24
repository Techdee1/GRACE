import { LuaSkill } from 'lua-cli'
import { z } from 'zod'

import { GenerateSTRTool } from '../tools/GenerateSTRTool.js'

import type { TransactionAnalysisResult } from '../types/analysis.js'

type ReportingSkillInput = {
  analysis: TransactionAnalysisResult
  generate_report: boolean
  case_reference?: string
  reporting_period?: string
}

type ReportingSkillOutput =
  | {
      ok: true
      message: string
      str_draft: {
        str_id: string
        status: 'PENDING_REVIEW'
        compliance_notice: string
        executive_summary: string
      }
    }
  | {
      ok: false
      message: string
      reason:
        | 'INTENT_REQUIRED'
        | 'ANALYSIS_NOT_READY'
        | 'GENERATION_FAILED'
        | 'INVALID_ANALYSIS_STATE'
    }

export async function runReportingSkill(input: ReportingSkillInput): Promise<ReportingSkillOutput> {
  if (!input.generate_report) {
    return {
      ok: false,
      message: 'Explicit user intent is required before generating an STR draft.',
      reason: 'INTENT_REQUIRED',
    }
  }

  if (input.analysis.status !== 'ANALYZED') {
    return {
      ok: false,
      message: 'Analysis is not in ANALYZED state. Generate or rerun analysis first.',
      reason: 'ANALYSIS_NOT_READY',
    }
  }

  if (input.analysis.reasoning_results.length === 0 || input.analysis.risk_results.length === 0) {
    return {
      ok: false,
      message: 'Analysis output is missing reasoning or risk data required for STR generation.',
      reason: 'INVALID_ANALYSIS_STATE',
    }
  }

  const strTool = new GenerateSTRTool()
  const generated = await strTool.execute({
    case_reference: input.case_reference,
    reporting_period: input.reporting_period,
    jurisdiction: 'NFIU',
    generated_by: 'GRACE Agent Reporting Skill',
    reasoning_results: input.analysis.reasoning_results,
    risk_results: input.analysis.risk_results,
  })

  if (!generated.ok || !generated.data) {
    return {
      ok: false,
      message: generated.error?.message ?? 'Failed to generate STR draft.',
      reason: 'GENERATION_FAILED',
    }
  }

  return {
    ok: true,
    message: 'STR draft generated successfully and marked for human review.',
    str_draft: {
      str_id: generated.data.str_draft.str_id,
      status: generated.data.str_draft.status,
      compliance_notice: generated.data.str_draft.compliance_notice,
      executive_summary: generated.data.str_draft.executive_summary,
    },
  }
}

const generateSTRReportTool = {
  name: 'generate_str_report',
  description:
    'Generate a PENDING_REVIEW STR draft from analyzed outputs. Requires explicit user intent.',
  inputSchema: z.object({
    analysis: z.any(),
    generate_report: z.boolean().default(true),
    case_reference: z.string().optional(),
    reporting_period: z.string().optional(),
  }),
  execute: async (input: unknown) => {
    const parsed = z
      .object({
        analysis: z.any(),
        generate_report: z.boolean().default(true),
        case_reference: z.string().optional(),
        reporting_period: z.string().optional(),
      })
      .parse(input)
    return runReportingSkill(parsed as ReportingSkillInput)
  },
}

export const reportingSkill = new LuaSkill({
  name: 'reporting',
  description: 'Generate NFIU-oriented STR drafts that are always PENDING_REVIEW.',
  context:
    'Use generate_str_report only when explicit user intent to generate a report is present and analysis status is ANALYZED with reasoning and risk outputs.',
  tools: [generateSTRReportTool as any],
})
