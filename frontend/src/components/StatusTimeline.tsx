import { Box, Stack, Typography } from '@mui/material';
import type { PaymentStatusEventDto } from 'shared';
import StatusBadge from './StatusBadge';
import { FONT_MONO } from '../theme';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Chronological list of a payment's status events
 */
export default function StatusTimeline({ events }: { events: PaymentStatusEventDto[] }) {
  if (events.length === 0) {
    return null;
  }
  return (
    <Stack>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        return (
          <Box key={event.id} sx={{ display: 'flex', gap: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mt: '6px',
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    flexGrow: 1,
                    width: '1px',
                    bgcolor: 'divider',
                    minHeight: 36,
                    mt: '4px',
                  }}
                />
              )}
            </Box>

            <Box sx={{ pb: isLast ? 0 : 3, flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: FONT_MONO,
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  mb: 0.75,
                }}
              >
                {dateFormatter.format(new Date(event.at))}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {event.fromStatus === null ? (
                  <>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                      Created as
                    </Typography>
                    <StatusBadge status={event.toStatus} />
                  </>
                ) : (
                  <>
                    <StatusBadge status={event.fromStatus} />
                    <Typography
                      component="span"
                      sx={{ color: 'text.secondary', fontSize: '1rem', lineHeight: 1 }}
                    >
                      →
                    </Typography>
                    <StatusBadge status={event.toStatus} />
                  </>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
