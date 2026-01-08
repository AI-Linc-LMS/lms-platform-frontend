'use client';

import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  IconButton,
} from '@mui/material';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface CustomDialogProps extends Omit<DialogProps, 'open'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  showCloseButton?: boolean;
}

export const Dialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  showCloseButton = true,
  ...props
}) => {
  return (
    <MuiDialog open={open} onClose={onClose} maxWidth="sm" fullWidth {...props}>
      {title && (
        <DialogTitle>
          {title}
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
};


