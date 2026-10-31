import { parseId } from "../../utils/params.js";
import * as service from "./stations.service.js";

export async function list(req, res) {
  res.json({ stations: await service.listStations() });
}

export async function create(req, res) {
  res.status(201).json({ station: await service.createStation(req.body) });
}

export async function update(req, res) {
  res.json({
    station: await service.updateStation(parseId(req.params.id), req.body),
  });
}
