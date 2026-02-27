module.exports = { notarize: (data) => crypto.createHash('sha256').update(data).digest('hex') };
