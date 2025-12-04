/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://vintstreet.com';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Fetch all data in parallel
    const [
      productsResult,
      categoriesResult,
      subcategoriesResult,
      subSubcategoriesResult,
      blogPostsResult,
      sellersResult,
    ] = await Promise.all([
      supabase
        .from('listings')
        .select('slug, updated_at')
        .eq('status', 'published')
        .eq('archived', false)
        .not('slug', 'is', null),
      supabase.from('product_categories').select('slug').eq('is_active', true),
      supabase.from('product_subcategories').select('slug, product_categories!inner(slug)').eq('is_active', true),
      supabase
        .from('product_sub_subcategories')
        .select('slug, product_subcategories!inner(slug, product_categories!inner(slug))')
        .eq('is_active', true),
      supabase.from('blog_posts').select('slug, updated_at').eq('visibility', 'published'),
      supabase.from('seller_profiles').select('user_id, updated_at'),
    ]);

    // Start building sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/live', priority: '0.8', changefreq: 'hourly' },
      { loc: '/auctions', priority: '0.8', changefreq: 'hourly' },
      { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/support', priority: '0.5', changefreq: 'monthly' },
      { loc: '/founders', priority: '0.5', changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Product pages
    if (productsResult.data) {
      for (const product of productsResult.data) {
        if (product.slug) {
          const lastmod = product.updated_at?.split('T')[0] || today;
          xml += `  <url>
    <loc>${SITE_URL}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      }
    }

    // Level 1 category pages
    if (categoriesResult.data) {
      for (const cat of categoriesResult.data) {
        xml += `  <url>
    <loc>${SITE_URL}/shop/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Level 2 subcategory pages
    if (subcategoriesResult.data) {
      for (const sub of subcategoriesResult.data) {
        const parentSlug = (sub as unknown).product_categories?.slug;
        if (parentSlug) {
          xml += `  <url>
    <loc>${SITE_URL}/shop/${parentSlug}/${sub.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }
    }

    // Level 3 sub-subcategory pages
    if (subSubcategoriesResult.data) {
      for (const subSub of subSubcategoriesResult.data) {
        const subcat = (subSub as unknown).product_subcategories;
        const parentSlug = subcat?.product_categories?.slug;
        const subcatSlug = subcat?.slug;
        if (parentSlug && subcatSlug) {
          xml += `  <url>
    <loc>${SITE_URL}/shop/${parentSlug}/${subcatSlug}/${subSub.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }
    }

    // Blog posts
    if (blogPostsResult.data) {
      for (const post of blogPostsResult.data) {
        const lastmod = post.updated_at?.split('T')[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Seller pages
    if (sellersResult.data) {
      for (const seller of sellersResult.data) {
        const lastmod = seller.updated_at?.split('T')[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/seller/${seller.user_id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
