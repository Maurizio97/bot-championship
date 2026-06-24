const { BadRequestError } = require('../utils/errors');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new BadRequestError('CSV non valido: virgolette non chiuse.');
  }

  values.push(current.trim());
  return values;
}

function parseCsvText(csvText) {
  const text = String(csvText || '').replace(/^\uFEFF/, '').trim();
  if (!text) {
    throw new BadRequestError('Il CSV e vuoto.');
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new BadRequestError('Il CSV deve contenere header e almeno una riga dati.');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const hasPlayerId = headers.includes('player_id');
  const hasPlayerName = headers.includes('player_name');

  if (!hasPlayerId && !hasPlayerName) {
    throw new BadRequestError('Il CSV deve contenere player_id oppure player_name.');
  }

  if (!headers.includes('goals') || !headers.includes('assists')) {
    throw new BadRequestError('Il CSV deve contenere le colonne goals e assists.');
  }

  const rows = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    const record = {};

    headers.forEach((header, headerIndex) => {
      record[header] = (values[headerIndex] || '').trim();
    });

    rows.push({
      lineNumber: lineIndex + 1,
      player_id: record.player_id || '',
      player_name: record.player_name || '',
      goals: record.goals,
      assists: record.assists
    });
  }

  return rows;
}

function findAttachment(message) {
  const firstAttachment = message?.attachments?.first?.();
  if (!firstAttachment) {
    throw new BadRequestError('Devi allegare un file CSV al comando season new.');
  }

  return firstAttachment;
}

function isCsvAttachment(attachment) {
  const name = (attachment?.name || '').toLowerCase();
  const contentType = (attachment?.contentType || '').toLowerCase();

  return name.endsWith('.csv') || contentType.includes('csv') || contentType.includes('text/plain');
}

async function importStatsRowsFromAttachment(message) {
  const attachment = findAttachment(message);

  if (!isCsvAttachment(attachment)) {
    throw new BadRequestError('Il file allegato deve essere un CSV (.csv).');
  }

  const response = await fetch(attachment.url);
  if (!response.ok) {
    throw new BadRequestError(`Impossibile scaricare il CSV allegato (HTTP ${response.status}).`);
  }

  const csvText = await response.text();
  const rows = parseCsvText(csvText);

  return {
    rows,
    fileName: attachment.name || 'allegato.csv'
  };
}

module.exports = {
  parseCsvText,
  importStatsRowsFromAttachment
};

