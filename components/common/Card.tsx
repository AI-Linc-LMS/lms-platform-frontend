'use client';

import { Card as MuiCard, CardContent, CardActions, CardProps } from '@mui/material';
import { ReactNode } from 'react';

interface CustomCardProps extends CardProps {
  children: ReactNode;
  actions?: ReactNode;
}

export const Card: React.FC<CustomCardProps> = ({ children, actions, ...props }) => {
  return (
    <MuiCard {...props}>
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  );
};


