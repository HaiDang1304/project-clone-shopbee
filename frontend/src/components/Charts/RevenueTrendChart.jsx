import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip)

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function createGradient(context, startColor, endColor) {
  const { chart } = context
  const { chartArea, ctx } = chart

  if (!chartArea) return startColor

  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)
  return gradient
}

export default function RevenueTrendChart({
  trend = [],
  className = '',
  lineColor = '#f97316',
  fillStart = 'rgba(249, 115, 22, 0.28)',
  fillEnd = 'rgba(249, 115, 22, 0.02)',
  gridColor = 'rgba(120, 113, 108, 0.12)',
  tickColor = '#78716c',
}) {
  const points = trend?.length ? trend : []
  const labels = points.map((point) => point.day || point.date || '')
  const values = points.map((point) => Number(point.value || 0))

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: lineColor,
        backgroundColor: (context) => createGradient(context, fillStart, fillEnd),
        borderWidth: 3,
        cubicInterpolationMode: 'monotone',
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: lineColor,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointRadius: (context) => (context.chart.data.labels.length > 90 ? 0 : 4),
        tension: 0.42,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(28, 25, 23, 0.92)',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.14)',
        borderWidth: 1,
        callbacks: {
          label: (context) => `Doanh thu: ${formatCurrency(context.parsed.y)}`,
          title: (items) => items[0]?.label || '',
        },
        displayColors: false,
        padding: 10,
        titleColor: '#fed7aa',
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          color: tickColor,
          font: {
            size: 11,
            weight: 700,
          },
          maxRotation: 0,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: gridColor,
          drawTicks: false,
        },
        ticks: {
          color: tickColor,
          callback: (value) => {
            const numberValue = Number(value || 0)
            if (numberValue >= 1000000) return `${Math.round(numberValue / 1000000)}tr`
            if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}k`
            return numberValue
          },
          font: {
            size: 10,
          },
          maxTicksLimit: 5,
          padding: 8,
        },
      },
    },
  }

  return (
    <div className={`h-full min-h-[180px] w-full ${className}`}>
      <Line data={data} options={options} />
    </div>
  )
}
