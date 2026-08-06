import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  Boxes,
  Activity,
  Network,
  GitBranch,
  Puzzle,
  TrendingUp,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { ScalabilitySummary } from '../types';

export const ScalabilityTab: React.FC<{ business: any }> = ({ business }) => {
  const [data, setData] = useState<ScalabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchScalabilityData();
  }, [business?.id]);

  const fetchScalabilityData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scalability/summary', {
        headers: { 'x-business-id': business?.id || 'biz-001' },
      });
      const result = await res.json();
      if (result.success && result.summary) {
        setData(result.summary);
      }
    } catch (err) {
      console.error('Failed to load scalability metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLoadTest = async () => {
    setSimulating(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/scalability/simulate-load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || 'biz-001',
        },
      });
      const result = await res.json();
      if (result.success) {
        setActionMsg({
          type: 'success',
          text: result.message || '10,000 Tenant concurrent load test completed! Avg latency: 8ms, 0 tenant cross-talk.',
        });
        fetchScalabilityData();
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Error simulating load test.' });
    } finally {
      setSimulating(false);
    }
  };

  const handleProvisionShard = async () => {
    setSimulating(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/scalability/provision-shard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || 'biz-001',
        },
      });
      const result = await res.json();
      if (result.success) {
        setActionMsg({
          type: 'success',
          text: result.message || 'New tenant shard provisioned! Scalable capacity expanded by +10,000 businesses.',
        });
        fetchScalabilityData();
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Error provisioning new shard.' });
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
        <p className="text-xs font-semibold">Analyzing Cluster Topology & Modular Plugin Bus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Network className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Modular Platform Scalability & Sharding Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Decoupled micro-shard topology supporting up to 100,000+ business tenants with isolated background worker pools, zero-downtime plugin extensions, and independent scaling.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleSimulateLoadTest}
            disabled={simulating}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>Simulate 10k Tenant Load</span>
          </button>
          <button
            type="button"
            onClick={handleProvisionShard}
            disabled={simulating}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>Provision Shard</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionMsg.text}</span>
          </div>
        </div>
      )}

      {/* Cluster Capacity Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Architecture Pattern</div>
          <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">
            {data?.architecturePattern || 'Decoupled Event-Driven'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Zero-impact tenant isolation</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Supported Tenant Capacity</div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {data?.supportedTenantCapacity?.toLocaleString() || '100,000'} Businesses
          </div>
          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-Expanding Shards
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Global TPS Capacity</div>
          <div className="text-xl font-black text-emerald-500 font-mono">
            {data?.globalTpsCapacity?.toLocaleString() || '50,000'} req/s
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Sub-10ms Route Dispatch</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Active Modular Plugins</div>
          <div className="text-xl font-black text-blue-500 font-mono">
            {data?.plugins?.length || 4} Extensions
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Decoupled Event Bus</div>
        </div>
      </div>

      {/* Tenant Shards Topology */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-500" />
            Active Tenant Shard Topologies
          </h4>
          <span className="text-[10px] font-mono text-slate-400">Total Shards: {data?.shards?.length || 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Shard ID</th>
                <th className="p-3.5">Cloud Region</th>
                <th className="p-3.5">Active Tenants</th>
                <th className="p-3.5">Read Replica Lag</th>
                <th className="p-3.5">Avg Latency</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.shards?.map((shard) => (
                <tr key={shard.shardId} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                  <td className="p-3.5 font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                    {shard.shardId}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{shard.region}</td>
                  <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {shard.activeTenantsCount.toLocaleString()}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{shard.readReplicaLagMs}ms</td>
                  <td className="p-3.5 font-mono text-emerald-500 font-bold">{shard.avgLatencyMs}ms</td>
                  <td className="p-3.5 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
                      {shard.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asynchronous Processing Worker Pools */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Asynchronous Worker Queues (Redis / BullMQ Pool)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Queue Name</th>
                <th className="p-3.5">Active Worker Nodes</th>
                <th className="p-3.5">Pending Jobs</th>
                <th className="p-3.5">Throughput</th>
                <th className="p-3.5 text-right">Failure Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.workerQueues?.map((q) => (
                <tr key={q.queueName} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                  <td className="p-3.5 font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                    {q.queueName}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{q.activeWorkers} Nodes</td>
                  <td className="p-3.5 font-mono text-slate-500">{q.pendingJobs}</td>
                  <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {q.processedPerSec.toLocaleString()} ops/s
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">{q.failureRatePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modular Plugins & Integration Extensions Bus */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-blue-500" />
          Modular Integration Extensions (Decoupled Zero-Downtime Bus)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.plugins?.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{p.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono text-[9px]">
                    v{p.version}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Category: <span className="font-mono text-slate-700 dark:text-slate-300">{p.category}</span> • Used by {p.tenantCountUsing} tenants
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
