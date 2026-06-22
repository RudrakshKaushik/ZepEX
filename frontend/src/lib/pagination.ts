export interface PaginatedResponse<T> {
  count: number
  total_pages: number
  current_page: number
  results: T[]
}

export function paginatedResults<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: PaginatedResponse<T> }>,
): Promise<T[]> {
  const first = await fetchPage(1)
  const items = [...first.data.results]
  for (let page = 2; page <= first.data.total_pages; page += 1) {
    const res = await fetchPage(page)
    items.push(...res.data.results)
  }
  return items
}
