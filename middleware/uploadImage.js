const fs = require('fs')

module.exports = async function(req, res, next) {
    try {
        if(!req.files || Object.keys(req.files).length === 0)
        return res.status(400).json({msg: "No files were uploaded."})
        
        const file = req.files.file

        if(file.size > 1024 * 1024) {
            removeTnp(file.tempFilePath)
            return res.status(400).json({msg: "File too large"})
            // if less than 1mb
        }
        if(file.mimetype !== 'image/png' && file.mimetype !== 'image/png') {
            removeTnp(file.tempFilePath)
            return res.status(400).json({msg: "Invalid image format"})
            // if less than 1mb
        }  
        next()
    }catch (err) {
        return res.status(500).json({msg: err.message})
    }

}

const removeTmp = (path) => {
    fs.unlink(path, err => {
       if(err) throw err
    })
}

