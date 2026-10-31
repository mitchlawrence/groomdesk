import * as service from "./settings.service.js";

export async function get(req, res) {
  res.json({ settings: await service.getSettings() });
}

export async function update(req, res) {
  res.json({ settings: await service.updateSettings(req.body) });
}
