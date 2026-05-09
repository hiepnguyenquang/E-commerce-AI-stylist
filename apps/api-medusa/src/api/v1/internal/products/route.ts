import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";

// Hàm hỗ trợ tạo slug (URL-safe handle) từ tiếng Việt
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Tách các ký tự có dấu thành ký tự gốc và dấu
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Bỏ các ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-') // Loại bỏ nhiều gạch ngang liên tiếp
    + '-' + Date.now().toString().slice(-6); // Thêm số ngẫu nhiên để tránh trùng lặp
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { title, description, price, category } = req.body;
    const file = (req as any).file;

    if (!title || !price) {
      return res.status(400).json({ error: "Missing required fields (title, price)" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Lấy Sales Channel mặc định
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id"],
    });
    const defaultSalesChannelId = salesChannels[0]?.id;

    // Lấy Shipping Profile mặc định
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
    });
    const defaultShippingProfileId = shippingProfiles[0]?.id;

    // Lấy URL hình ảnh nếu có
    const images = [];
    if (file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      images.push({ url: `${baseUrl}/uploads/${file.filename}` });
    }

    const productInput: any = {
      title,
      handle: generateHandle(title),
      description: description || "",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: defaultShippingProfileId,
      options: [
        {
          title: "Size",
          values: ["Free Size"],
        },
      ],
      variants: [
        {
          title: "Free Size",
          prices: [
            {
              amount: parseFloat(price),
              currency_code: "vnd",
            },
          ],
          options: {
            Size: "Free Size",
          },
        },
      ],
      sales_channels: defaultSalesChannelId ? [{ id: defaultSalesChannelId }] : [],
    };

    if (images.length > 0) {
      productInput.images = images;
    }

    // Nếu có truyền category name thì tìm category id tương ứng
    if (category) {
       const { data: categories } = await query.graph({
         entity: "product_category",
         fields: ["id", "name"],
         filters: { name: category }
       });
       
       // Nếu có category trùng tên, thêm vào
       if (categories.length > 0) {
         productInput.category_ids = [categories[0].id];
       }
    }

    const { result } = await createProductsWorkflow(req.scope).run({
      input: {
        products: [productInput],
      },
    });

    return res.status(201).json({
      status: "success",
      product: result[0],
    });
  } catch (error: any) {
    console.error("[Internal Product API] Error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
