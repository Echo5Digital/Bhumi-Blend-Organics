// For PATCH requests: a field sent as `null` means "clear it" (becomes $unset),
// a field left out means "don't touch it", anything else is set.
export function toUpdate(data: Record<string, unknown>) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value === null) $unset[key] = "";
    else $set[key] = value;
  }
  return {
    ...(Object.keys($set).length > 0 && { $set }),
    ...(Object.keys($unset).length > 0 && { $unset }),
  };
}
