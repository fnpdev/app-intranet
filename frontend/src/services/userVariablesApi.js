import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/user-vars';

export async function getUserVariables(token) {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}

export async function updateUserVariable(token, { key, value, description }) {
  const response = await axios.post(API_URL, { key, value, description }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}
