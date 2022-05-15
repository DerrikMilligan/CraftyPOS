
interface GenericResponse<K> {
  success : boolean,
  message?: string,
  data   ?: K,
}

