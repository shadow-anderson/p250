import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Collapse,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useAuditTrail } from '../../hooks/useAdminApi';
import TimeAgo from 'react-timeago';

/**
 * AuditTrail Component
 * Searchable, paginated audit log with filters
 */
export default function AuditTrail() {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Expanded rows
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch data
  const { data: auditData, isLoading } = useAuditTrail(
    {
      page: page + 1,
      perPage: rowsPerPage,
      search: searchQuery,
      actionType: actionTypeFilter !== 'all' ? actionTypeFilter : undefined,
      actor: actorFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    },
    true
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'WEIGHT_UPDATE':
        return 'primary';
      case 'KPI_WEIGHT_UPDATE':
        return 'secondary';
      case 'CALIBRATION_PREVIEW':
        return 'info';
      case 'WEIGHT_ROLLBACK':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete history of all admin actions and changes
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by actor, target, comment..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  label="Action Type"
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="WEIGHT_UPDATE">Weight Update</MenuItem>
                  <MenuItem value="KPI_WEIGHT_UPDATE">KPI Weight Update</MenuItem>
                  <MenuItem value="CALIBRATION_PREVIEW">Calibration Preview</MenuItem>
                  <MenuItem value="WEIGHT_ROLLBACK">Weight Rollback</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <IconButton sx={{ mt: 1 }}>
                <FilterListIcon />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Activity Log ({auditData?.total || 0} entries)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : auditData?.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditData?.entries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRow(entry.id)}
                            sx={{
                              transform: expandedRow === entry.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s',
                            }}
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            <TimeAgo date={entry.timestamp} />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {entry.actorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.actor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.actionType.replace(/_/g, ' ')}
                            size="small"
                            color={getActionTypeColor(entry.actionType)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{entry.target}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                            {entry.comment}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <TableRow>
                        <TableCell colSpan={6} sx={{ p: 0, borderBottom: expandedRow === entry.id ? undefined : 0 }}>
                          <Collapse in={expandedRow === entry.id} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Old Value
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                                    {formatValue(entry.oldValue)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    New Value
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                                    {formatValue(entry.newValue)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Metadata
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                                    {JSON.stringify(entry.metadata, null, 2)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Full Comment
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {entry.comment}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={auditData?.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
