export const formatList = (items: string[] | number[]) => {
  return items.map((item) => ({
    value: item,
    label: item,
  }));
};
