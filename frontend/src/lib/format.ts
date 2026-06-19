export function formatMetricDisplay(value: number) {
  return value < 10 ? `0${value}` : String(value)
}
