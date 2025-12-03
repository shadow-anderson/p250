import { Box } from '@mui/material';

/**
 * Logo Component - Placeholder for Prabhaav brand logo
 * Can be replaced with actual SVG or image asset
 */
const Logo = ({ size = 60, color = '#2563eb' }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${color} 0%, #7c3aed 100%)`,
        boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)',
        },
      }}
    >
      {/* Stylized "P" for Prabhaav */}
      <Box
        component="span"
        sx={{
          fontSize: size * 0.5,
          fontWeight: 800,
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1,
        }}
      >
        P
      </Box>
    </Box>
  );
};

export default Logo;
