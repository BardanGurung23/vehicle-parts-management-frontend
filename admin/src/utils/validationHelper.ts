export const trimFormData = <T extends Record<string, any>>(data: T): T => {
  return Object.keys(data).reduce((accumulator, key) => {
    const value = data[key];
    const result = { ...accumulator } as T;

    if (typeof value === "string") {
      result[key as keyof T] = value.trim() as T[keyof T];
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map((item) =>
        typeof item === "object"
          ? trimFormData(item)
          : typeof item === "string"
            ? item.trim()
            : item,
      ) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      result[key as keyof T] = trimFormData(value) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }

    return result;
  }, {} as T);
};
