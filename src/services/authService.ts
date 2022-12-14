import { User } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/authRepository.js';
import {
  conflictError,
  notFoundError,
  unauthorizedError,
} from '../utils/errorUtils.js';
import { compareHashData, hashData } from '../utils/hashDataUtils.js';
dotenv.config();

export type CreateUserData = Omit<User, 'id'>;
export type LoginUserData = Omit<User, 'id' | 'name'>;

async function signUp(createUserData: CreateUserData) {
  const existingUser = await userRepository.findByEmail(createUserData.email);
  if (existingUser) throw conflictError('Email must be unique');

  const hashedPassword = hashData(createUserData.password);

  await userRepository.insert({ ...createUserData, password: hashedPassword });
}

async function signIn(loginData: LoginUserData) {
  const user = await getUserOrFail(loginData);

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

  delete user.password;

  return { ...user, token };
}

async function getUserOrFail(loginData: LoginUserData) {
  const user = await userRepository.findByEmail(loginData.email);
  if (!user) throw unauthorizedError('Invalid credentials');

  const isPasswordValid = compareHashData(loginData.password, user.password);
  if (!isPasswordValid) throw unauthorizedError('Invalid credentials');

  return user;
}

async function findById(id: number) {
  const user = await userRepository.findById(id);
  if (!user) throw notFoundError('User not found');

  return user;
}

export default {
  signUp,
  signIn,
  findById,
};