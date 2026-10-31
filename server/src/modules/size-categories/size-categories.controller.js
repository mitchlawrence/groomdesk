import { parseId } from "../../utils/params.js";
import * as service from "./size-categories.service.js";

export async function list(req, res) {
  res.json({ sizeCategories: await service.listSizes() });
}

export async function create(req, res) {
  res.status(201).json({ sizeCategory: await service.createSize(req.body) });
}

export async function update(req, res) {
  res.json({
    sizeCategory: await service.updateSize(parseId(req.params.id), req.body),
  });
}
