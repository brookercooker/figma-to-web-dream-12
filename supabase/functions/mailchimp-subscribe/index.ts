import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createHash } from 'node:crypto';

interface SubscribeBody {
  email: string;
  audienceId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  tags?: string[];
  mergeFields?: Record<string, unknown>;
}

const DEFAULT_AUDIENCE_ID = '710b75abb6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
    if (!apiKey) {
      return json({ error: 'MAILCHIMP_API_KEY is not configured' }, 500);
    }
    const dashIdx = apiKey.lastIndexOf('-');
    if (dashIdx === -1) {
      return json({ error: 'Invalid Mailchimp API key format (missing server prefix)' }, 500);
    }
    const serverPrefix = apiKey.slice(dashIdx + 1);

    let body: SubscribeBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: 'A valid email is required' }, 400);
    }

    const audienceId = (body.audienceId || DEFAULT_AUDIENCE_ID).trim();
    if (!/^[a-zA-Z0-9]{6,20}$/.test(audienceId)) {
      return json({ error: 'Invalid audienceId' }, 400);
    }

    const merge_fields: Record<string, unknown> = { ...(body.mergeFields || {}) };
    if (body.firstName) merge_fields.FNAME = String(body.firstName).slice(0, 100);
    if (body.lastName) merge_fields.LNAME = String(body.lastName).slice(0, 100);
    if (body.phone) merge_fields.PHONE = String(body.phone).slice(0, 40);
    if (body.address) {
      // Mailchimp default ADDRESS merge tag is structured; send addr1 with placeholders
      // for the required sub-fields so partial addresses are accepted.
      merge_fields.ADDRESS = {
        addr1: String(body.address).slice(0, 200),
        city: '-',
        state: '-',
        zip: '-',
        country: 'US',
      };
    }

    const subscriberHash = createHash('md5').update(email).digest('hex');
    const authHeader = `Basic ${btoa(`anystring:${apiKey}`)}`;
    const listUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}`;
    const url = `${listUrl}/members/${subscriberHash}`;

    // Auto-fill required merge fields with placeholders so legacy required custom
    // fields (leftover from old Mailchimp forms) don't block API signups.
    try {
      const mfRes = await fetch(
        `${listUrl}/merge-fields?count=100&fields=merge_fields.tag,merge_fields.type,merge_fields.required,merge_fields.options`,
        { headers: { Authorization: authHeader } },
      );
      if (mfRes.ok) {
        const mfData = await mfRes.json();
        for (const f of mfData.merge_fields || []) {
          if (!f.required) continue;
          if (merge_fields[f.tag] !== undefined && merge_fields[f.tag] !== '') continue;
          if (f.type === 'dropdown' || f.type === 'radio') {
            const first = f.options?.choices?.[0];
            if (first) merge_fields[f.tag] = first;
          } else if (f.type === 'number') {
            merge_fields[f.tag] = 0;
          } else if (f.type === 'address') {
            merge_fields[f.tag] = { addr1: 'N/A', city: '-', state: '-', zip: '-', country: 'US' };
          } else {
            merge_fields[f.tag] = 'N/A';
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch merge fields; proceeding without auto-fill', e);
    }

    // PUT upserts: creates or updates the member. status_if_new = "subscribed" opts in on first add.
    const mcRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields,
      }),
    });

    const mcData = await mcRes.json().catch(() => ({}));

    if (!mcRes.ok) {
      console.error('Mailchimp error', mcRes.status, mcData);
      return json(
        {
          error: mcData?.title || 'Mailchimp request failed',
          detail: mcData?.detail || null,
          status: mcRes.status,
        },
        mcRes.status,
      );
    }

    // Optional: add tags
    if (body.tags && body.tags.length > 0) {
      const tagsRes = await fetch(`${url}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
        },
        body: JSON.stringify({
          tags: body.tags.slice(0, 20).map((name) => ({ name: String(name).slice(0, 100), status: 'active' })),
        }),
      });
      if (!tagsRes.ok) {
        const tagsErr = await tagsRes.json().catch(() => ({}));
        console.warn('Mailchimp tag error', tagsRes.status, tagsErr);
      }
    }

    return json({ success: true, id: mcData.id, status: mcData.status });
  } catch (err) {
    console.error('mailchimp-subscribe unexpected error', err);
    return json({ error: 'Unexpected server error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
