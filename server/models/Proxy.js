import database from '../config/database.js';

class Proxy {
  static async createappointmentData(appointmentData) {
    const {
      member_title,
      member_initials,
      member_surname,
      member_full_name,
      member_membership_number,
      member_id_number,
      appointment_type,
      location_signed,
      signed_date,
      group_id
    } = appointmentData;

    const sql = `
      INSERT INTO proxy_appointments (
        member_title, member_initials, member_surname, member_full_name,
        member_membership_number, member_id_number,
        appointment_type, location_signed, signed_date, group_id
      )
      OUTPUT INSERTED.id
      VALUES (
        '${member_title}', '${member_initials}', '${member_surname}', '${member_full_name}',
        '${member_membership_number}', '${member_id_number}',
        '${appointment_type}', '${location_signed}', '${signed_date}', ${group_id}
      )
    `;

    const result = await database.query(sql);
    if (result && result.length > 0 && result[0].id !== undefined) {
      return result[0].id;
    } else {
      throw new Error('Proxy appointment ID not returned from INSERT');
    }
  }

  static async creategroupData(groupData) {
    const {
      group_name,
      principal_id,
      appointment_type,
      trustee_remuneration,
      remuneration_policy,
      auditors_appointment,
      agm_motions,
      total_votes_delegated,
      is_active
    } = groupData;

    const sql = `
      INSERT INTO proxy_groups (
        group_name,
        principal_id,
        appointment_type,
        trustee_remuneration,
        remuneration_policy,
        auditors_appointment,
        agm_motions,
        total_votes_delegated,
        is_active
      )
      OUTPUT INSERTED.id
      VALUES (
        '${group_name}',
        ${principal_id},
        '${appointment_type}',
        ${trustee_remuneration ? `'${trustee_remuneration}'` : 'NULL'},
        ${remuneration_policy ? `'${remuneration_policy}'` : 'NULL'},
        ${auditors_appointment ? `'${auditors_appointment}'` : 'NULL'},
        ${agm_motions ? `'${agm_motions}'` : 'NULL'},
        ${total_votes_delegated || 0},
        ${is_active ? 1 : 0}
      )
    `;

    const result = await database.query(sql);
    if (result && result.length > 0 && result[0].id !== undefined) {
      return result[0].id;
    } else {
      throw new Error('Proxy group ID not returned from INSERT');
    }
  }

  static async creategroup_id({
    group_id,
    member_id,
    initials,
    surname,
    full_name,
    membership_number,
    id_number,
    appointment_type,
    votes_allocated
  }) {
    const sql = `
      INSERT INTO proxy_group_members (
        group_id,
        member_id,
        initials,
        surname,
        full_name,
        membership_number,
        id_number,
        appointment_type,
        votes_allocated
      )
      OUTPUT INSERTED.id
      VALUES (
        ${group_id},
        ${member_id},
        '${initials}',
        '${surname}',
        '${full_name}',
        '${membership_number}',
        '${id_number}',
        '${appointment_type}',
        ${votes_allocated || 0}
      )
    `;

    const result = await database.query(sql);
    if (result && result.length > 0 && result[0].id !== undefined) {
      return result[0].id;
    } else {
      throw new Error('Proxy group member ID not returned from INSERT');
    }
  }

  static async addAllowedCandidate({ proxy_member_id, employee_id }) {
    const sql = `
      INSERT INTO proxy_member_allowed_candidates (proxy_member_id, employee_id)
      VALUES (${proxy_member_id}, ${employee_id})
    `;
    await database.query(sql);
  }

  static async activateGroup(groupId) {
    const sql = `
      UPDATE proxy_groups
      SET is_active = 1
      WHERE id = ${groupId}
    `;
    await database.query(sql);
  }

  static async deactivateGroup(groupId) {
    const sql = `
      UPDATE proxy_groups
      SET is_active = 0
      WHERE id = ${groupId}
    `;
    await database.query(sql);
  }
}

export default Proxy;
