/**
 * Voila (C2C) API Integration
 * Used for peer-to-peer marketplace shipping
 */

export interface VoilaCredentials {
  apiUser: string;
  apiToken: string;
}

export interface VoilaParcelItem {
  description: string;
  origin_country: string;
  quantity: number;
  value_currency: string;
  weight: number;
  weight_unit: string;
  sku: string;
  hs_code: string;
  value: string;
  extended_description: string;
}

export interface VoilaShipmentData {
  label_size: string;
  label_format: string;
  generate_invoice: boolean;
  generate_packing_slip: boolean;
  courier: {
    auth_company: string;
  };
  collection_date: string;
  dc_service_id: string;
  reference: string;
  reference_2?: string;
  delivery_instructions?: string;
  ship_from: {
    name: string;
    phone?: string;
    email?: string;
    company_name?: string;
    address_1: string;
    address_2?: string;
    address_3?: string;
    city: string;
    county?: string;
    postcode: string;
    country_iso: string;
    company_id?: string;
    tax_id?: string;
    ioss_number?: string | null;
  };
  ship_to: {
    name: string;
    phone: string;
    email: string;
    company_name?: string | null;
    address_1: string;
    address_2?: string;
    address_3?: string;
    city: string;
    county?: string;
    postcode: string;
    country_iso: string;
    tax_id?: string | null;
  };
  parcels: Array<{
    dim_width: number;
    dim_height: number;
    dim_length: number;
    dim_unit: string;
    items: VoilaParcelItem[];
  }>;
}

export interface VoilaCreateLabelRequest {
  auth_company: string;
  format_address_default: boolean;
  request_id: string;
  shipment: VoilaShipmentData;
}

export interface VoilaCreateLabelResponse {
  tracking_codes: string[];
  tracking_urls?: string[];
  courier?: string;
  qr_code?: string;
  uri?: string;
  label_base64?: string;
  barcode_base64?: string;
  [key: string]: unknown;
}

export class VoilaApiClient {
  private baseUrl = 'https://production.courierapi.co.uk/api/couriers/v1/MoovParcel';
  private credentials: VoilaCredentials;

  constructor(credentials: VoilaCredentials) {
    this.credentials = credentials;
  }

  /**
   * Create shipping label via Voila API
   */
  async createLabel(request: VoilaCreateLabelRequest): Promise<VoilaCreateLabelResponse> {
    const endpoint = `${this.baseUrl}/create-label`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'api-user': this.credentials.apiUser,
        'api-token': this.credentials.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voila API label creation failed: ${response.status} - ${errorText}`);
    }

    const data: VoilaCreateLabelResponse = await response.json();

    if (!data.tracking_codes || data.tracking_codes.length === 0) {
      throw new Error('Voila API response missing tracking codes');
    }

    return data;
  }

  /**
   * Get dimensions based on weight
   */
  static getDimensionsFromWeight(weight: number): {
    length: number;
    width: number;
    height: number;
  } {
    if (weight < 1) {
      return { length: 37, width: 23, height: 10 };
    }
    if (weight < 2) {
      return { length: 47, width: 34, height: 15 };
    }
    if (weight < 30) {
      return { length: 50, width: 38, height: 19 };
    }
    return { length: 100, width: 100, height: 100 };
  }

  /**
   * Map shipping method to dc_service_id
   */
  static mapShippingMethodToServiceId(shippingMethod: string): string {
    const mapping: Record<string, string> = {
      'DPD Next Day': 'DPD-12DROPQR',
      'Yodel Standard': 'YOD-C2CPS',
    };
    return mapping[shippingMethod] || 'DPD-11DROPQR'; // Default fallback
  }
}
