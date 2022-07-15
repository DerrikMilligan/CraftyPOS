interface GenericResponseTypelessSuccess {
  success : true;
  message?: string;
  data   ?: any;
}

interface GenericResponseTypelessError {
  success : false;
  message : string;
  data   ?: any;
}

interface GenericResponseSuccess<T> {
  success : true
  message?: string
  data    : T
}

interface GenericResponseError<T> {
  success : true
  message : string
  data   ?: T
}

type GenericResponse<T = null> =
  GenericResponseSuccess<T>      |
  GenericResponseError<T>        |
  GenericResponseTypelessSuccess |
  GenericResponseTypelessError;

interface Pagination<T> {
  page      : number
  totalPages: number
  data      : T
}
