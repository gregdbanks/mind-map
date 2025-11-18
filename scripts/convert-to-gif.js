const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path

ffmpeg.setFfmpegPath(ffmpegPath)

// Function to convert video to GIF
function convertToGif(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      width = 800,
      fps = 15,
      duration = null,
      startTime = 0
    } = options

    let command = ffmpeg(inputPath)
      .outputOptions([
        '-vf',
        `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop',
        '0'
      ])

    if (duration) {
      command = command.setStartTime(startTime).setDuration(duration)
    }

    command
      .output(outputPath)
      .on('end', () => {
        console.log(`✅ GIF created: ${outputPath}`)
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('❌ Error creating GIF:', err)
        reject(err)
      })
      .run()
  })
}

// Convert the demo videos
async function createDemoGifs() {
  try {
    // Main demo GIF
    await convertToGif(
      path.join(__dirname, '../frontend/demo-raw.mp4'),
      path.join(__dirname, '../assets/mindmap-demo.gif'),
      { width: 800, fps: 15 }
    )

    // Create demo GIF
    await convertToGif(
      path.join(__dirname, '../frontend/demo-create-raw.mp4'),
      path.join(__dirname, '../assets/mindmap-create-demo.gif'),
      { width: 800, fps: 15 }
    )

    console.log('✅ All GIFs created successfully!')
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  createDemoGifs()
}

module.exports = { convertToGif }