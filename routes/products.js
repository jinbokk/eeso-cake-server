// https://www.geeksforgeeks.org/how-to-upload-single-multiple-image-to-cloudinary-using-node-js/

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const cloudinary = require("../middleware/cloudinary.js");
const multer = require("multer");
const fs = require("fs");
const ObjectId = require("mongodb").ObjectId;

if (!fs.existsSync("./temp")) {
  fs.mkdirSync("./temp");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./temp");
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  const cloudinary_upload = await cloudinary.uploader.upload(
    req.file.path,
    "eeso-cake-upload-preset",
    {
      use_filename: true,
      unique_filename: false,
      folder: "eeso-cake-product-images",
    }
  );

  const image_url = cloudinary_upload.secure_url;
  const designArray = req.body.design.split(",").map((item) => item);
  //append로 추가한 데이터는 string처리가 되어 서버단에서 다시 array화 하는 작업을 추가함

  const product = new Product({
    title:
      req.body.title !== "" && req.body.title !== "undefined"
        ? req.body.title
        : null,
    ingredient:
      req.body.ingredient !== "" && req.body.ingredient !== "undefined"
        ? req.body.ingredient
        : null,
    layer:
      req.body.layer !== "" && req.body.layer !== "undefined"
        ? req.body.layer
        : null,
    design: designArray,
    image_url: image_url,
    description:
      req.body.description !== "" && req.body.description !== "undefined"
        ? req.body.description
        : null,
    price:
      req.body.price !== "" && req.body.price !== "undefined"
        ? req.body.price
        : null,
    sold: 0,
    views: 0,
  });

  product.save((err) => {
    if (err) {
      res.status(400).json({ success: false, message: err });
      return fs.unlinkSync(req.file.path);
    } else {
      res.status(200).json({ success: true });
      return fs.unlinkSync(req.file.path);
    }
  });
});

// CAKES PAGE
router.get("/cakes/:ingredient", async (req, res) => {
  let { ingredient } = req.params;
  let { design } = req.query;

  let query;
  if (ingredient === "all") {
    query = {};
  } else {
    if (design) {
      query = {
        ingredient: ingredient,
        design: design,
      };
    } else {
      query = {
        ingredient: ingredient,
      };
    }
  }

  const option = {
    page: parseInt(req.query.page) || Number(1),
    limit: 30,
  };

  const results = await Product.paginate(query, option);

  return res.status(200).json(results);
});

// ORDER PAGE
router.get("/order/list", async (req, res) => {
  // let { ingredient } = req.params;

  // let query;
  // if (ingredient === "all") {
  //   query = {
  //     price: { $ne: null },
  //   };
  // } else {
  //   query = {
  //     ingredient: ingredient,
  //   };
  // }

  let query = {
    price: { $ne: null },
  };

  const option = {
    page: parseInt(req.query.page) || Number(1),
    limit: 30,
  };

  const results = await Product.paginate(query, option);

  return res.status(200).json(results);
});

router.get("/order/detail", async (req, res) => {
  let productId = req.query;
  let o_id = new ObjectId(productId);

  console.log("productID::::::", productId);

  Product.find({ _id: o_id }).exec((err, productDetail) => {
    if (err) return res.status(400).send(err);
    return res
      .status(200)
      .send({ success: true, productDetail: productDetail[0] });
  });
});

module.exports = router;
