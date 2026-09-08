// One-time data migration: role 'employee' -> 'maker'.
// Run once with: node scripts/migrate-employee-to-maker.cjs
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

function loadMongoUri() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const contents = fs.readFileSync(envPath, 'utf8')
  const match = contents.match(/^MONGODB_URI=(.+)$/m)
  if (!match) throw new Error('MONGODB_URI not found in .env.local')
  return match[1].trim()
}

async function main() {
  const uri = loadMongoUri()
  await mongoose.connect(uri)

  const result = await mongoose.connection.collection('users').updateMany(
    { role: 'employee' },
    { $set: { role: 'maker' } },
  )
  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} user(s).`)

  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
