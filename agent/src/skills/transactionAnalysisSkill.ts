import { BuildEntityGraphTool } from '../tools/BuildEntityGraphTool.js'
import { DetectPatternsTool } from '../tools/DetectPatternsTool.js'
import { ParseTransactionsTool } from '../tools/ParseTransactionsTool.js'
import { ReasonAboutClusterTool } from '../tools/ReasonAboutClusterTool.js'
import { ScoreAndExplainRiskTool } from '../tools/ScoreAndExplainRiskTool.js'

import type { TransactionAnalysisResult } from '../types/analysis.js'

type RunTransactionAnalysisInput = {
  data: string
  format?: 'csv' | 'json'
  sensitivity?: 'low' | 'medium' | 'high'
  reason_mode?: 'deterministic' | 'live'
}

export async function runTransactionAnalysis(
  input: RunTransactionAnalysisInput
): Promise<TransactionAnalysisResult> {
  const parseTool = new ParseTransactionsTool()
  const graphTool = new BuildEntityGraphTool()
  const detectTool = new DetectPatternsTool()
  const reasonTool = new ReasonAboutClusterTool()
  const riskTool = new ScoreAndExplainRiskTool()

  try {
    const parsed = await parseTool.execute({
      data: input.data,
      format: input.format ?? 'csv',
    })

    if (!parsed.ok || !parsed.data) {
      return {
        status: 'FAILED',
        message: parsed.error?.message ?? 'Failed to parse transactions',
        parsed_summary: { total_parsed: 0, total_skipped: 0 },
        graph_summary: { entity_count: 0, edge_count: 0, density: 0 },
        candidates: [],
        reasoning_results: [],
        risk_results: [],
      }
    }

    const graph = await graphTool.execute({
      transactions: parsed.data.transactions,
      top_hubs: 5,
      min_shared_cluster_size: 2,
    })

    if (!graph.ok || !graph.data) {
      return {
        status: 'FAILED',
        message: graph.error?.message ?? 'Failed to build graph',
        parsed_summary: {
          total_parsed: parsed.data.summary.total_parsed,
          total_skipped: parsed.data.summary.total_skipped,
        },
        graph_summary: { entity_count: 0, edge_count: 0, density: 0 },
        candidates: [],
        reasoning_results: [],
        risk_results: [],
      }
    }

    const detected = await detectTool.execute({
      transactions: parsed.data.transactions,
      sensitivity: input.sensitivity ?? 'medium',
      min_total_amount_ngn: 1_000_000,
      max_candidates: 15,
    })

    if (!detected.ok || !detected.data) {
      return {
        status: 'FAILED',
        message: detected.error?.message ?? 'Failed to detect suspicious patterns',
        parsed_summary: {
          total_parsed: parsed.data.summary.total_parsed,
          total_skipped: parsed.data.summary.total_skipped,
        },
        graph_summary: {
          entity_count: graph.data.stats.entity_count,
          edge_count: graph.data.stats.edge_count,
          density: graph.data.stats.density,
        },
        candidates: [],
        reasoning_results: [],
        risk_results: [],
      }
    }

    if (detected.data.candidates.length === 0) {
      return {
        status: 'NO_CANDIDATES',
        message: 'No suspicious candidates detected for current sensitivity profile.',
        parsed_summary: {
          total_parsed: parsed.data.summary.total_parsed,
          total_skipped: parsed.data.summary.total_skipped,
        },
        graph_summary: {
          entity_count: graph.data.stats.entity_count,
          edge_count: graph.data.stats.edge_count,
          density: graph.data.stats.density,
        },
        candidates: [],
        reasoning_results: [],
        risk_results: [],
      }
    }

    const reasoningResults: TransactionAnalysisResult['reasoning_results'] = []

    for (const candidate of detected.data.candidates.slice(0, 8)) {
      const reasoned = await reasonTool.execute({
        candidate,
        execution_mode: input.reason_mode ?? 'deterministic',
      })

      if (!reasoned.ok || !reasoned.data) {
        continue
      }

      reasoningResults.push({
        candidate_id: candidate.candidate_id,
        pattern_type: candidate.pattern_type,
        entities: candidate.entities,
        confidence: reasoned.data.confidence,
        recommendation: reasoned.data.recommendation,
        red_flags: reasoned.data.red_flags,
        rationale_summary: reasoned.data.rationale_summary,
      })
    }

    if (reasoningResults.length === 0) {
      return {
        status: 'NO_CANDIDATES',
        message: 'Candidates found but reasoning could not produce actionable outputs.',
        parsed_summary: {
          total_parsed: parsed.data.summary.total_parsed,
          total_skipped: parsed.data.summary.total_skipped,
        },
        graph_summary: {
          entity_count: graph.data.stats.entity_count,
          edge_count: graph.data.stats.edge_count,
          density: graph.data.stats.density,
        },
        candidates: detected.data.candidates.map((item) => ({
          candidate_id: item.candidate_id,
          pattern_type: item.pattern_type,
          entities: item.entities,
          score: item.score,
        })),
        reasoning_results: [],
        risk_results: [],
      }
    }

    const risk = await riskTool.execute({
      reasoning_results: reasoningResults.map((result) => ({
        candidate_id: result.candidate_id,
        entities: result.entities,
        confidence: result.confidence,
        recommendation: result.recommendation,
        red_flags: result.red_flags,
      })),
      adjacency: graph.data.adjacency,
      decay_factor: 0.6,
      baseline_score: 5,
      max_score: 100,
    })

    if (!risk.ok || !risk.data) {
      return {
        status: 'FAILED',
        message: risk.error?.message ?? 'Failed to score risk',
        parsed_summary: {
          total_parsed: parsed.data.summary.total_parsed,
          total_skipped: parsed.data.summary.total_skipped,
        },
        graph_summary: {
          entity_count: graph.data.stats.entity_count,
          edge_count: graph.data.stats.edge_count,
          density: graph.data.stats.density,
        },
        candidates: detected.data.candidates.map((item) => ({
          candidate_id: item.candidate_id,
          pattern_type: item.pattern_type,
          entities: item.entities,
          score: item.score,
        })),
        reasoning_results: reasoningResults,
        risk_results: [],
      }
    }

    return {
      status: 'ANALYZED',
      message: `Analysis completed with ${detected.data.summary.total_candidates} candidate(s).`,
      parsed_summary: {
        total_parsed: parsed.data.summary.total_parsed,
        total_skipped: parsed.data.summary.total_skipped,
      },
      graph_summary: {
        entity_count: graph.data.stats.entity_count,
        edge_count: graph.data.stats.edge_count,
        density: graph.data.stats.density,
      },
      candidates: detected.data.candidates.map((item) => ({
        candidate_id: item.candidate_id,
        pattern_type: item.pattern_type,
        entities: item.entities,
        score: item.score,
      })),
      reasoning_results: reasoningResults,
      risk_results: risk.data.risks,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown transaction analysis failure'

    return {
      status: 'FAILED',
      message,
      parsed_summary: { total_parsed: 0, total_skipped: 0 },
      graph_summary: { entity_count: 0, edge_count: 0, density: 0 },
      candidates: [],
      reasoning_results: [],
      risk_results: [],
    }
  }
}

export const transactionAnalysisSkill = {
  name: 'transaction-analysis',
  description: 'Runs deterministic AML analysis chain: parse -> graph -> detect -> reason -> risk.',
  run: runTransactionAnalysis,
}
