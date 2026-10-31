'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Zap,
  Play,
  Pause,
  Layers,
  Globe,
} from 'lucide-react';
import { NetworkStatsData, fetchNetworkStats } from '@/lib/api';

export interface TrafficHistoryPoint {
  time: string;
  e1_rx: number; // Indibiz download
  e1_tx: number; // Indibiz upload
  e2_rx: number; // Difusi download
  e2_tx: number; // Difusi upload
}

function formatSpeed(bps: number): string {
  if (bps >= 1000000000) return (bps / 1000000000).toFixed(2) + ' Gbps';
  if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps';
  if (bps >= 1000) return (bps / 1000).toFixed(1) + ' Kbps';
  return bps.toFixed(0) + ' bps';
}

interface Props {
  initialData?: NetworkStatsData | null;
}

export default function NetworkRealtimeChart({ initialData }: Props) {
  const [activeIface, setActiveIface] = useState<'ether2' | 'ether1' | 'both'>('ether2');
  const [history, setHistory] = useState<TrafficHistoryPoint[]>([]);
  const [latestData, setLatestData] = useState<NetworkStatsData | null>(initialData || null);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxPoints = 25;

  // Poll live traffic every 2.5s
  useEffect(() => {
    let isMounted = true;

    const tick = async () => {
      if (!isLive) return;
      try {
        const res = await fetchNetworkStats();
        if (!isMounted || !res || !res.interfaces) return;

        setLatestData(res);

        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        const e1 = res.interfaces.ether1_indibiz;
        const e2 = res.interfaces.ether2_difusi;

        setHistory((prev) => {
          const newPoint: TrafficHistoryPoint = {
            time: timeStr,
            e1_rx: e1?.rx_bps || 0,
            e1_tx: e1?.tx_bps || 0,
            e2_rx: e2?.rx_bps || 0,
            e2_tx: e2?.tx_bps || 0,
          };
          const next = [...prev, newPoint];
          if (next.length > maxPoints) {
            return next.slice(next.length - maxPoints);
          }
          return next;
        });
      } catch (err) {
        console.warn('Realtime traffic tick error:', err);
      }
    };

    // Initial tick
    tick();
    const interval = setInterval(tick, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive]);

  // Current interface data
  const currentE1 = latestData?.interfaces?.ether1_indibiz;
  const currentE2 = latestData?.interfaces?.ether2_difusi;

  // Compute displayed values according to active selection
  const currentStats = useMemo(() => {
    if (activeIface === 'ether1') {
      return {
        title: 'ether 1 - Indibiz (Guru)',
        subtitle: 'ISP 1 &bull; Sumber Utama Koneksi Guru & Staf',
        badge: 'INDIBIZ',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        rx: currentE1?.rx_bps || 0,
        tx: currentE1?.tx_bps || 0,
        rx_fmt: currentE1?.rx_fmt || '0 bps',
        tx_fmt: currentE1?.tx_fmt || '0 bps',
        rx_pps: currentE1?.rx_pps || 0,
        tx_pps: currentE1?.tx_pps || 0,
      };
    } else if (activeIface === 'ether2') {
      return {
        title: 'ether 2 - Difusi (Siswa)',
        subtitle: 'ISP 2 &bull; IP Publik 103.158.96.244, Hotspot Siswa & Server',
        badge: 'DIFUSI DEDICATED',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        rx: currentE2?.rx_bps || 0,
        tx: currentE2?.tx_bps || 0,
        rx_fmt: currentE2?.rx_fmt || '0 bps',
        tx_fmt: currentE2?.tx_fmt || '0 bps',
        rx_pps: currentE2?.rx_pps || 0,
        tx_pps: currentE2?.tx_pps || 0,
      };
    } else {
      const rxTotal = (currentE1?.rx_bps || 0) + (currentE2?.rx_bps || 0);
      const txTotal = (currentE1?.tx_bps || 0) + (currentE2?.tx_bps || 0);
      return {
        title: 'Dual-WAN (Indibiz + Difusi)',
        subtitle: 'Gabungan Trafik Guru (ether 1) + Siswa (ether 2)',
        badge: 'DUAL ISP TOTAL',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        rx: rxTotal,
        tx: txTotal,
        rx_fmt: formatSpeed(rxTotal),
        tx_fmt: formatSpeed(txTotal),
        rx_pps: (currentE1?.rx_pps || 0) + (currentE2?.rx_pps || 0),
        tx_pps: (currentE1?.tx_pps || 0) + (currentE2?.tx_pps || 0),
      };
    }
  }, [activeIface, currentE1, currentE2]);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 180;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Chart data points according to selection
  const chartPoints = useMemo(() => {
    return history.map((h) => {
      let rx = 0;
      let tx = 0;
      if (activeIface === 'ether1') {
        rx = h.e1_rx;
        tx = h.e1_tx;
      } else if (activeIface === 'ether2') {
        rx = h.e2_rx;
        tx = h.e2_tx;
      } else {
        rx = h.e1_rx + h.e2_rx;
        tx = h.e1_tx + h.e2_tx;
      }
      return { time: h.time, rx, tx };
    });
  }, [history, activeIface]);

  // Compute Peak & Dynamic Max Scale
  const { maxSpeed, peakRx, peakTx } = useMemo(() => {
    let pRx = 0;
    let pTx = 0;
    chartPoints.forEach((p) => {
      if (p.rx > pRx) pRx = p.rx;
      if (p.tx > pTx) pTx = p.tx;
    });
    const maxVal = Math.max(pRx, pTx, 500000); // Minimum scale 500 Kbps for pleasant visuals
    // Give 15% headroom
    const scaledMax = Math.ceil((maxVal * 1.15) / 100000) * 100000;
    return { maxSpeed: scaledMax, peakRx: pRx, peakTx: pTx };
  }, [chartPoints]);

  // Helper to calculate X and Y coordinates
  const getCoords = (index: number, total: number, val: number) => {
    const x = total <= 1 ? padLeft : padLeft + (index / (total - 1)) * plotWidth;
    const ratio = Math.min(Math.max(val / maxSpeed, 0), 1);
    const y = padTop + (1 - ratio) * plotHeight;
    return { x, y };
  };

  // Build SVG Paths for Download (Rx) and Upload (Tx)
  const { pathRx, areaRx, pathTx, areaTx, lastRxCoords, lastTxCoords } = useMemo(() => {
    if (chartPoints.length === 0) {
      return {
        pathRx: '',
        areaRx: '',
        pathTx: '',
        areaTx: '',
        lastRxCoords: null,
        lastTxCoords: null,
      };
    }

    const len = chartPoints.length;
    const rxCoords = chartPoints.map((p, i) => getCoords(i, len, p.rx));
    const txCoords = chartPoints.map((p, i) => getCoords(i, len, p.tx));

    const linePath = (coords: { x: number; y: number }[]) => {
      return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    };

    const areaPath = (coords: { x: number; y: number }[]) => {
      if (coords.length === 0) return '';
      const baseLine = (padTop + plotHeight).toFixed(1);
      const firstX = coords[0].x.toFixed(1);
      const lastX = coords[coords.length - 1].x.toFixed(1);
      const lPath = linePath(coords);
      return `${lPath} L ${lastX} ${baseLine} L ${firstX} ${baseLine} Z`;
    };

    return {
      pathRx: linePath(rxCoords),
      areaRx: areaPath(rxCoords),
      pathTx: linePath(txCoords),
      areaTx: areaPath(txCoords),
      lastRxCoords: rxCoords[rxCoords.length - 1],
      lastTxCoords: txCoords[txCoords.length - 1],
    };
  }, [chartPoints, maxSpeed]);

  // Hover point details
  const hoveredPoint = hoverIndex !== null && chartPoints[hoverIndex] ? chartPoints[hoverIndex] : null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Monitor Trafik Realtime (Dual WAN ISP)
            </h3>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${currentStats.badgeColor}`}
            >
              {currentStats.badge}
            </span>
          </div>
          <p
            className="text-xs text-slate-500 font-medium mt-0.5"
            dangerouslySetInnerHTML={{ __html: currentStats.subtitle }}
          />
        </div>

        {/* Interface Switcher & Pause/Play */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveIface('ether2')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeIface === 'ether2'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ether 2 (Siswa)
            </button>
            <button
              onClick={() => setActiveIface('ether1')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeIface === 'ether1'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ether 1 (Guru)
            </button>
            <button
              onClick={() => setActiveIface('both')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeIface === 'both'
                  ? 'bg-white text-purple-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual WAN
            </button>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isLive ? 'Jeda grafik (Pause)' : 'Lanjutkan grafik (Resume)'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Speed Readouts KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Download Realtime */}
        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              Download (Rx)
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight font-mono">
            {hoveredPoint ? formatSpeed(hoveredPoint.rx) : currentStats.rx_fmt}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">
            Paket: {currentStats.rx_pps} pps
          </div>
        </div>

        {/* Upload Realtime */}
        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Upload (Tx)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight font-mono">
            {hoveredPoint ? formatSpeed(hoveredPoint.tx) : currentStats.tx_fmt}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">
            Paket: {currentStats.tx_pps} pps
          </div>
        </div>

        {/* Puncak Download */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Puncak Download
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {formatSpeed(peakRx)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Terekam dalam grafik
          </div>
        </div>

        {/* Puncak Upload */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Puncak Upload
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {formatSpeed(peakTx)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Terekam dalam grafik
          </div>
        </div>
      </div>

      {/* SVG Realtime Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 p-2 sm:p-3 text-slate-100 shadow-inner">
        {/* Floating live indicator & time info */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span className="w-2.5 h-1 bg-blue-500 rounded-sm"></span>
              Download (Rx)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-1 bg-emerald-500 rounded-sm"></span>
              Upload (Tx)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE STREAM
              </span>
            ) : (
              <span className="text-amber-400 font-bold">PAUSED</span>
            )}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Download Gradient */}
            <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* Upload Gradient */}
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-Axis speed labels */}
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
            const y = padTop + (1 - ratio) * plotHeight;
            const speedVal = maxSpeed * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray={ratio === 0 ? undefined : '2,3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {formatSpeed(speedVal)}
                </text>
              </g>
            );
          })}

          {/* Download Area & Line */}
          {areaRx && <path d={areaRx} fill="url(#rxGradient)" />}
          {pathRx && (
            <path
              d={pathRx}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Upload Area & Line */}
          {areaTx && <path d={areaTx} fill="url(#txGradient)" />}
          {pathTx && (
            <path
              d={pathTx}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Live pulsing point on the newest data point */}
          {lastRxCoords && isLive && (
            <circle
              cx={lastRxCoords.x}
              cy={lastRxCoords.y}
              r="4"
              fill="#60a5fa"
              className="animate-pulse"
            />
          )}
          {lastTxCoords && isLive && (
            <circle
              cx={lastTxCoords.x}
              cy={lastTxCoords.y}
              r="4"
              fill="#34d399"
              className="animate-pulse"
            />
          )}

          {/* Interactive invisible hover columns */}
          {chartPoints.map((_, i) => {
            const len = chartPoints.length;
            const x = len <= 1 ? padLeft : padLeft + (i / (len - 1)) * plotWidth;
            const colWidth = plotWidth / Math.max(len - 1, 1);
            return (
              <rect
                key={i}
                x={x - colWidth / 2}
                y={padTop}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-crosshair"
              />
            );
          })}

          {/* Hover indicator vertical line */}
          {hoverIndex !== null && chartPoints[hoverIndex] && (
            <line
              x1={getCoords(hoverIndex, chartPoints.length, 0).x}
              y1={padTop}
              x2={getCoords(hoverIndex, chartPoints.length, 0).x}
              y2={padTop + plotHeight}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* X-Axis bottom labels */}
          <text
            x={padLeft}
            y={svgHeight - 6}
            textAnchor="start"
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            -60s
          </text>
          <text
            x={padLeft + plotWidth * 0.5}
            y={svgHeight - 6}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            -30s
          </text>
          <text
            x={svgWidth - padRight}
            y={svgHeight - 6}
            textAnchor="end"
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            Sekarang ({latestData?.timestamp ? new Date(latestData.timestamp).toLocaleTimeString('id-ID') : 'LIVE'})
          </text>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-8 left-16 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg pointer-events-none">
            <div className="text-slate-400 font-bold mb-0.5">Waktu: {hoveredPoint.time}</div>
            <div className="text-blue-400">Download: {formatSpeed(hoveredPoint.rx)}</div>
            <div className="text-emerald-400">Upload: {formatSpeed(hoveredPoint.tx)}</div>
          </div>
        )}
      </div>

      {/* Footer Interface Info */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>ether 1: <b>Indibiz Telkom (Guru)</b></span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>ether 2: <b>DIFUSI Dedicated (Siswa)</b></span>
          </span>
        </div>
        <span className="font-mono text-slate-400">
          RouterOS v7 &bull; Sampling: 2.5s
        </span>
      </div>
    </div>
  );
}
