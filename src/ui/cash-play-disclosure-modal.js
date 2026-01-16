import { supabase } from '../supabase-client.js';

export async function showCashPlayDisclosureModal(onAccept, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'sheet';
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');
  modal.style.zIndex = '10000';

  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; margin: auto;">
      <div style="text-align: center; padding: 30px 30px 20px 30px;">
        <div style="
          display: inline-block;
          padding: 6px 14px;
          background: rgba(255, 165, 0, 0.15);
          border: 1px solid rgba(255, 165, 0, 0.4);
          border-radius: 20px;
          color: #ffa500;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 20px;
        ">
          🧪 Test Mode
        </div>

        <h2 style="
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #fff;
          line-height: 1.3;
        ">
          Before You Continue
        </h2>

        <div style="
          text-align: left;
          color: #ccc;
          line-height: 1.8;
          font-size: 16px;
          margin-bottom: 30px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <p style="margin-bottom: 0;">
            I understand that identity verification may be required before I can withdraw winnings.
            I can play without verification, but verification will be required before my first withdrawal.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="disclosure-accept-btn" style="
            width: 100%;
            padding: 16px;
            font-size: 18px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          ">
            I Agree
          </button>

          <button id="disclosure-cancel-btn" style="
            width: 100%;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.05);
            color: #aaa;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Back
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const acceptBtn = modal.querySelector('#disclosure-accept-btn');
  const cancelBtn = modal.querySelector('#disclosure-cancel-btn');

  acceptBtn.addEventListener('click', async () => {
    acceptBtn.disabled = true;
    acceptBtn.textContent = 'Saving...';
    acceptBtn.style.opacity = '0.7';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: existingProfile } = await supabase
        .from('user_verification_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from('user_verification_profiles')
          .update({ cash_play_disclosure_accepted: true })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_verification_profiles')
          .insert({
            user_id: user.id,
            cash_play_disclosure_accepted: true,
            verification_tier: 'T0',
            verification_status: 'unverified'
          });

        if (error) throw error;
      }

      modal.remove();
      onAccept();
    } catch (error) {
      console.error('[Disclosure] Error saving acceptance:', error);
      alert('Failed to save. Please try again.');
      acceptBtn.disabled = false;
      acceptBtn.textContent = 'I Understand';
      acceptBtn.style.opacity = '1';
    }
  });

  cancelBtn.addEventListener('click', () => {
    modal.remove();
    onCancel();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      onCancel();
    }
  });
}

export async function checkCashPlayDisclosureAccepted() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_verification_profiles')
      .select('cash_play_disclosure_accepted')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Disclosure] Error checking acceptance:', error);
      return false;
    }

    return data?.cash_play_disclosure_accepted || false;
  } catch (error) {
    console.error('[Disclosure] Error:', error);
    return false;
  }
}
