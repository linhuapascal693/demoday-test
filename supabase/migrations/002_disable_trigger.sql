-- 禁用自动创建用户资料的触发器（因为会导致注册失败）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 完成
