
interface GenericResponse<T> {
  success : boolean
  message?: string
  data   ?: T
}

interface Pagination<T> {
  page      : number
  totalPages: number
  data      : T
}
