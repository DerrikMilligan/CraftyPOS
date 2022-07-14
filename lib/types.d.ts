interface GenericResponse<T = null> {
  success : boolean
  message?: string
  data   ?: T
}

interface Pagination<T> {
  page      : number
  totalPages: number
  data      : T
}
