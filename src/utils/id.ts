let counter = 1000;

export const generateId = (prefix: string): string => {
  counter += 1;
  return `${prefix}-${counter}`;
};

export const getTimestampIso = (): string => {
  return new Date().toISOString();
};
