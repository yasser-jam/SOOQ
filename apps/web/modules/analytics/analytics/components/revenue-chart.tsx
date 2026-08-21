"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { Line } from "react-chartjs-2"

import { formatSyp } from "@/lib/money"

import type { RevenueBucket } from "../types"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

const CURRENT_COLOR = "#122640"
const PREVIOUS_COLOR = "#BA7B1B"
const GRID_COLOR = "rgba(18, 38, 64, 0.08)"

const formatBucketLabel = (bucketStart: string): string => {
  const date = new Date(bucketStart)
  if (Number.isNaN(date.getTime())) return bucketStart
  return date.toLocaleDateString("ar-SY", { month: "short", day: "numeric" })
}

type AnalyticsRevenueChartProps = {
  current: RevenueBucket[]
  previous: RevenueBucket[]
}

export function AnalyticsRevenueChart({
  current,
  previous,
}: AnalyticsRevenueChartProps) {
  const labels = current.map((bucket) => formatBucketLabel(bucket.bucketStart))

  const datasets = [
    {
      label: "الفترة الحالية",
      data: current.map((bucket) => bucket.revenue),
      borderColor: CURRENT_COLOR,
      backgroundColor: "rgba(18, 38, 64, 0.08)",
      pointBackgroundColor: CURRENT_COLOR,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 5,
      tension: 0.3,
      fill: true,
    },
    ...(previous.length
      ? [
          {
            label: "الفترة السابقة",
            data: previous.map((bucket) => bucket.revenue),
            borderColor: PREVIOUS_COLOR,
            backgroundColor: "transparent",
            pointBackgroundColor: PREVIOUS_COLOR,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            borderDash: [6, 4],
            tension: 0.3,
            fill: false,
          },
        ]
      : []),
  ]

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#44474D", font: { size: 12 } },
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: {
          color: "#44474D",
          font: { size: 12 },
          callback: (value) => formatSyp(Number(value)),
        },
      },
    },
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: "top",
        align: "end",
        labels: { usePointStyle: true, boxWidth: 8, color: "#44474D" },
      },
      tooltip: {
        callbacks: {
          label: (item) => `${item.dataset.label}: ${formatSyp(item.parsed.y)}`,
        },
      },
    },
  }

  return (
    <div className="h-72 w-full">
      <Line data={{ labels, datasets }} options={options} />
    </div>
  )
}
