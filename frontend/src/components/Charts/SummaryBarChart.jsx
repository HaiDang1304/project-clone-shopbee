import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export default function SummaryBarChart({
  items = [],
  className = '',
  color = '#c57900',
  valueType = 'number',
}) {
  const labels = items.map((item) => item.label)
  const values = items.map((item) => Number(item.value || 0))
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: color,
        borderRadius: 7,
        maxBarThickness: 32,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return valueType === 'currency' ? currencyFormatter.format(value) : new Intl.NumberFormat('vi-VN').format(value)
          },
        },
        displayColors: false,
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          autoSkip: true,
          color: '#6f5b4d',
          font: { size: 10, weight: 700 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(124, 102, 87, 0.14)', drawTicks: false },
        ticks: {
          color: '#7c6657',
          callback: (value) => {
            const numberValue = Number(value || 0)
            if (valueType === 'currency') {
              if (numberValue >= 1000000) return `${Math.round(numberValue / 1000000)}tr`
              if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}k`
            }
            return numberValue
          },
          font: { size: 10 },
          maxTicksLimit: 5,
        },
      },
    },
  }

  return (
    <div className={`h-full min-h-[180px] w-full ${className}`}>
      <Bar data={data} options={options} />
    </div>
  )
}
