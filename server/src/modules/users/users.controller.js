import { parseId } from "../../utils/params.js";
import * as service from "./users.service.js";

export async function list(req, res) {
  res.json({ users: await service.listUsers() });
}

export async function create(req, res) {
  res.status(201).json({ user: await service.createUser(req.body) });
}

export async function update(req, res) {
  res.json({
    user: await service.updateUser(
      req.user.id,
      parseId(req.params.id),
      req.body,
    ),
  });
}

export async function activate(req, res) {
  res.json({ user: await service.activateUser(parseId(req.params.id)) });
}

export async function deactivate(req, res) {
  const user = await service.deactivateUser(
    req.user.id,
    parseId(req.params.id),
    req.body.confirm === true,
  );
  res.json({ user });
}

export async function resetPassword(req, res) {
  await service.resetPassword(
    req.user.id,
    parseId(req.params.id),
    req.body.password,
  );
  res.status(204).end();
}

export async function updateMe(req, res) {
  res.json({ user: await service.updateOwnProfile(req.user.id, req.body) });
}

export async function changeMyPassword(req, res) {
  await service.changeOwnPassword(req.user.id, req.body);
  res.status(204).end();
}
