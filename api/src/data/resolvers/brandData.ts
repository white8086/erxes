import { Brands } from '../../db/models';
import { IBrandData } from '../../db/models/definitions/companies';

export default {
  async brandName(brandData: IBrandData) {
    const brand = await Brands.getBrand({ _id: brandData.brandId });
    return brand.name || '';
  }
};
