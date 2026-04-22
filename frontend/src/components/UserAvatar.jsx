import React, { useEffect, useState } from 'react';
import { Avatar } from '@mui/material';
import api from '../api/axiosInstance';

/**
 * Fetches a user's profile picture via the authenticated API and renders an MUI Avatar.
 * Falls back to initials (from the `name` prop) when no picture is set.
 *
 * @param {number}  userId        - User ID to fetch picture for
 * @param {string}  [name]        - Full name used to derive initials fallback
 * @param {number}  [size=40]     - Width and height in px
 * @param {*}       [refreshToken] - Change this value to force a re-fetch
 */
function UserAvatar({ userId, name, size = 40, refreshToken, sx, ...props }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let objectUrl = null;
    api.get(`/api/users/${userId}/picture`, { responseType: 'blob' })
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, refreshToken]);

  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : undefined;

  return (
    <Avatar src={src || undefined} sx={{ width: size, height: size, ...sx }} {...props}>
      {!src && initials}
    </Avatar>
  );
}

export default UserAvatar;
