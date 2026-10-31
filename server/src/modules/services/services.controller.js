import { parseId } from "../../utils/params.js";
import * as service from "./services.service.js";

export async function list(req, res) {
  res.json({ services: await service.listServices() });
}

export async function create(req, res) {
  res.status(201).json({ service: await service.createService(req.body) });
}

export async function update(req, res) {
  res.json({
    service: await service.updateService(parseId(req.params.id), req.body),
  });
}

export async function setPrices(req, res) {
  res.json({
    service: await service.setPrices(parseId(req.params.id), req.body.prices),
  });
}
